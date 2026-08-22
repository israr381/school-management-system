from collections import defaultdict
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db
from app.permissions import has_permission, require_organization_id

router = APIRouter(tags=["dashboard"])

TREND_DAYS = 7
RECENT_LIMIT = 6


def _totals(statuses: list[str]) -> schemas.AttendanceTotals:
    present = sum(1 for item in statuses if item == "present")
    absent = sum(1 for item in statuses if item == "absent")
    late = sum(1 for item in statuses if item == "late")
    total = len(statuses)
    percent = round(((present + late) / total) * 100, 1) if total else 0.0
    return schemas.AttendanceTotals(
        total=total,
        present=present,
        absent=absent,
        late=late,
        percent=percent,
    )


def _empty_totals() -> schemas.AttendanceTotals:
    return _totals([])


def _totals_from_counts(present: int, absent: int, late: int) -> schemas.AttendanceTotals:
    return _totals(["present"] * present + ["absent"] * absent + ["late"] * late)


def _trend_dates() -> list[date]:
    today = date.today()
    return [today - timedelta(days=offset) for offset in range(TREND_DAYS - 1, -1, -1)]


def _status_percent(status: Optional[str]) -> float:
    if status == "present":
        return 100.0
    if status == "late":
        return 50.0
    if status == "absent":
        return 0.0
    return 0.0


def _student_card(
    student: models.Student,
    statuses: list[str],
    today_status: Optional[str],
    recent_rows: list[models.StudentAttendance],
    include_parent: bool = False,
) -> schemas.DashboardStudentCard:
    parent = student.parent if include_parent else None
    return schemas.DashboardStudentCard(
        id=student.id,
        full_name=student.full_name,
        status=student.status,
        class_name=student.school_class.name if student.school_class else "",
        section_name=student.section.name if student.section else "",
        avatar_url=student.user.avatar_url if student.user else None,
        today_status=today_status,
        attendance=_totals(statuses),
        recent=[
            schemas.DashboardAttendanceRecord(
                attendance_date=row.attendance_date,
                status=row.status,
                class_name=row.school_class.name if row.school_class else None,
                section_name=row.section.name if row.section else None,
            )
            for row in recent_rows
        ],
        parent_name=parent.full_name if parent else None,
        parent_phone=parent.phone if parent else None,
        parent_email=parent.email if parent else None,
        parent_relationship=parent.relationship if parent else None,
    )


def _personal_trend(records: list[models.StudentAttendance] | list[models.TeacherAttendance]):
    by_date = {row.attendance_date: row.status for row in records}
    points: list[schemas.AttendanceTrendPoint] = []
    for day in _trend_dates():
        status = by_date.get(day)
        points.append(
            schemas.AttendanceTrendPoint(
                date=day,
                label=day.strftime("%a"),
                percent=_status_percent(status),
                recorded=status is not None,
                present=1 if status == "present" else 0,
                absent=1 if status == "absent" else 0,
                late=1 if status == "late" else 0,
                total=1 if status else 0,
            )
        )
    return points


def _group_attendance(rows: list[models.StudentAttendance]):
    by_student: dict[int, list[models.StudentAttendance]] = defaultdict(list)
    for row in rows:
        by_student[row.student_id].append(row)
    for items in by_student.values():
        items.sort(key=lambda item: item.attendance_date, reverse=True)
    return by_student


def _teacher_dashboard(db: Session, user: models.User, org_id: int) -> schemas.TeacherDashboardData:
    teacher = (
        db.query(models.Teacher)
        .options(
            joinedload(models.Teacher.class_assignment).options(
                joinedload(models.TeacherClassAssignment.school_class),
                joinedload(models.TeacherClassAssignment.section),
            ),
        )
        .filter(models.Teacher.user_id == user.id, models.Teacher.organization_id == org_id)
        .first()
    )
    my_rows: list[models.TeacherAttendance] = []
    today_status = None
    if teacher:
        my_rows = (
            db.query(models.TeacherAttendance)
            .filter(models.TeacherAttendance.teacher_id == teacher.id)
            .order_by(models.TeacherAttendance.attendance_date.desc())
            .all()
        )
        today_status = next((row.status for row in my_rows if row.attendance_date == date.today()), None)

    my_attendance = _totals([row.status for row in my_rows])
    recent_my = [
        schemas.DashboardAttendanceRecord(attendance_date=row.attendance_date, status=row.status)
        for row in my_rows[:RECENT_LIMIT]
    ]

    assignment = teacher.class_assignment if teacher else None
    if not teacher or not assignment:
        return schemas.TeacherDashboardData(
            assigned=False,
            teacher_id=teacher.id if teacher else None,
            subject=teacher.subject if teacher else None,
            today_status=today_status,
            today_class=_empty_totals(),
            class_attendance=_empty_totals(),
            my_attendance=my_attendance,
            trend=_personal_trend(my_rows),
            recent_my_attendance=recent_my,
        )

    students = (
        db.query(models.Student)
        .options(
            joinedload(models.Student.school_class),
            joinedload(models.Student.section),
            joinedload(models.Student.user),
            joinedload(models.Student.parent),
        )
        .filter(
            models.Student.organization_id == org_id,
            models.Student.class_id == assignment.class_id,
            models.Student.section_id == assignment.section_id,
            models.Student.status == "active",
        )
        .order_by(models.Student.full_name.asc())
        .all()
    )
    student_ids = [student.id for student in students]
    class_rows: list[models.StudentAttendance] = []
    if student_ids:
        class_rows = (
            db.query(models.StudentAttendance)
            .options(
                joinedload(models.StudentAttendance.school_class),
                joinedload(models.StudentAttendance.section),
            )
            .filter(models.StudentAttendance.student_id.in_(student_ids))
            .all()
        )

    by_student = _group_attendance(class_rows)
    today = date.today()
    today_statuses = [row.status for row in class_rows if row.attendance_date == today]
    trend_start = today - timedelta(days=TREND_DAYS - 1)
    by_day: dict[date, list[str]] = defaultdict(list)
    for row in class_rows:
        if row.attendance_date >= trend_start:
            by_day[row.attendance_date].append(row.status)

    trend = []
    for day in _trend_dates():
        day_statuses = by_day.get(day, [])
        day_totals = _totals(day_statuses)
        trend.append(
            schemas.AttendanceTrendPoint(
                date=day,
                label=day.strftime("%a"),
                percent=day_totals.percent,
                recorded=bool(day_statuses),
                present=day_totals.present,
                absent=day_totals.absent,
                late=day_totals.late,
                total=day_totals.total,
            )
        )

    history_by_date: dict[date, list[str]] = defaultdict(list)
    for row in class_rows:
        history_by_date[row.attendance_date].append(row.status)
    recent_class_days = []
    for day in sorted(history_by_date.keys(), reverse=True)[:RECENT_LIMIT]:
        day_totals = _totals(history_by_date[day])
        recent_class_days.append(
            schemas.TeacherClassDaySummary(
                attendance_date=day,
                total_students=day_totals.total,
                present_count=day_totals.present,
                absent_count=day_totals.absent,
                late_count=day_totals.late,
                percent=day_totals.percent,
            )
        )

    student_cards = [
        _student_card(
            student,
            [row.status for row in by_student.get(student.id, [])],
            next((row.status for row in by_student.get(student.id, []) if row.attendance_date == today), None),
            by_student.get(student.id, [])[:3],
            include_parent=True,
        )
        for student in students
    ]

    return schemas.TeacherDashboardData(
        assigned=True,
        teacher_id=teacher.id,
        subject=teacher.subject,
        class_id=assignment.class_id,
        class_name=assignment.school_class.name if assignment.school_class else "",
        section_id=assignment.section_id,
        section_name=assignment.section.name if assignment.section else "",
        student_count=len(students),
        today_taken=bool(today_statuses),
        today_status=today_status,
        today_class=_totals(today_statuses),
        class_attendance=_totals([row.status for row in class_rows]),
        my_attendance=my_attendance,
        trend=trend,
        students=student_cards,
        recent_class_days=recent_class_days,
        recent_my_attendance=recent_my,
    )


def _student_dashboard(db: Session, user: models.User, org_id: int) -> schemas.StudentDashboardData:
    student = (
        db.query(models.Student)
        .options(
            joinedload(models.Student.school_class),
            joinedload(models.Student.section),
            joinedload(models.Student.user),
            joinedload(models.Student.parent),
        )
        .filter(models.Student.user_id == user.id, models.Student.organization_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No student profile found")

    rows = (
        db.query(models.StudentAttendance)
        .options(
            joinedload(models.StudentAttendance.school_class),
            joinedload(models.StudentAttendance.section),
        )
        .filter(models.StudentAttendance.student_id == student.id)
        .order_by(models.StudentAttendance.attendance_date.desc())
        .all()
    )
    parent = student.parent
    today_status = next((row.status for row in rows if row.attendance_date == date.today()), None)
    return schemas.StudentDashboardData(
        student_id=student.id,
        full_name=student.full_name,
        status=student.status,
        class_name=student.school_class.name if student.school_class else "",
        section_name=student.section.name if student.section else "",
        avatar_url=student.user.avatar_url if student.user else None,
        today_status=today_status,
        parent_name=parent.full_name if parent else "",
        parent_phone=parent.phone if parent else "",
        parent_email=parent.email if parent else "",
        parent_relationship=parent.relationship if parent else "",
        attendance=_totals([row.status for row in rows]),
        trend=_personal_trend(rows),
        recent=[
            schemas.DashboardAttendanceRecord(
                attendance_date=row.attendance_date,
                status=row.status,
                class_name=row.school_class.name if row.school_class else None,
                section_name=row.section.name if row.section else None,
            )
            for row in rows[:RECENT_LIMIT]
        ],
    )


def _parent_dashboard(db: Session, user: models.User, org_id: int) -> schemas.ParentDashboardData:
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.user_id == user.id, models.Parent.organization_id == org_id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No parent profile found")

    children = (
        db.query(models.Student)
        .options(
            joinedload(models.Student.school_class),
            joinedload(models.Student.section),
            joinedload(models.Student.user),
            joinedload(models.Student.parent),
        )
        .filter(models.Student.parent_id == parent.id, models.Student.organization_id == org_id)
        .order_by(models.Student.full_name.asc())
        .all()
    )
    student_ids = [child.id for child in children]
    rows: list[models.StudentAttendance] = []
    if student_ids:
        rows = (
            db.query(models.StudentAttendance)
            .options(
                joinedload(models.StudentAttendance.school_class),
                joinedload(models.StudentAttendance.section),
            )
            .filter(models.StudentAttendance.student_id.in_(student_ids))
            .all()
        )

    by_student = _group_attendance(rows)
    today = date.today()
    today_present = 0
    today_absent = 0
    cards = []
    for child in children:
        child_rows = by_student.get(child.id, [])
        child_today = next((row.status for row in child_rows if row.attendance_date == today), None)
        if child_today == "present" or child_today == "late":
            today_present += 1
        elif child_today == "absent":
            today_absent += 1
        cards.append(
            _student_card(
                child,
                [row.status for row in child_rows],
                child_today,
                child_rows[:RECENT_LIMIT],
            )
        )

    trend_start = today - timedelta(days=TREND_DAYS - 1)
    by_day: dict[date, list[str]] = defaultdict(list)
    for row in rows:
        if row.attendance_date >= trend_start:
            by_day[row.attendance_date].append(row.status)

    trend = []
    for day in _trend_dates():
        day_statuses = by_day.get(day, [])
        day_totals = _totals(day_statuses)
        trend.append(
            schemas.AttendanceTrendPoint(
                date=day,
                label=day.strftime("%a"),
                percent=day_totals.percent,
                recorded=bool(day_statuses),
                present=day_totals.present,
                absent=day_totals.absent,
                late=day_totals.late,
                total=day_totals.total,
            )
        )

    return schemas.ParentDashboardData(
        parent_id=parent.id,
        full_name=parent.full_name,
        relationship=parent.relationship,
        children_count=len(children),
        today_present=today_present,
        today_absent=today_absent,
        combined_attendance=_totals([row.status for row in rows]),
        trend=trend,
        children=cards,
    )


def _present_sum(model):
    return func.coalesce(func.sum(case((model.status == "present", 1), else_=0)), 0)


def _absent_sum(model):
    return func.coalesce(func.sum(case((model.status == "absent", 1), else_=0)), 0)


def _late_sum(model):
    return func.coalesce(func.sum(case((model.status == "late", 1), else_=0)), 0)


def _query_attendance_totals(db: Session, model, org_id: int, attendance_date: Optional[date] = None):
    query = db.query(
        func.count(model.id),
        _present_sum(model),
        _absent_sum(model),
        _late_sum(model),
    ).filter(model.organization_id == org_id)
    if attendance_date is not None:
        query = query.filter(model.attendance_date == attendance_date)
    row = query.one()
    return _totals_from_counts(int(row[1] or 0), int(row[2] or 0), int(row[3] or 0))


def _academic_year(today: date) -> str:
    start = today.year if today.month >= 8 else today.year - 1
    return f"{start} - {start + 1}"


def _admin_dashboard(db: Session, org_id: int) -> schemas.AdminDashboardData:
    today = date.today()
    student_base = db.query(models.Student).filter(models.Student.organization_id == org_id)
    teacher_base = db.query(models.Teacher).filter(models.Teacher.organization_id == org_id)

    total_students = student_base.count()
    active_students = student_base.filter(models.Student.status == "active").count()
    total_teachers = teacher_base.count()
    active_teachers = teacher_base.filter(models.Teacher.status == "active").count()
    total_parents = (
        db.query(func.count(models.Parent.id)).filter(models.Parent.organization_id == org_id).scalar() or 0
    )
    active_classes = (
        db.query(func.count(models.SchoolClass.id))
        .filter(models.SchoolClass.organization_id == org_id)
        .scalar()
        or 0
    )

    student_attendance = _query_attendance_totals(db, models.StudentAttendance, org_id)
    today_student = _query_attendance_totals(db, models.StudentAttendance, org_id, today)
    teacher_attendance = _query_attendance_totals(db, models.TeacherAttendance, org_id)
    today_teacher = _query_attendance_totals(db, models.TeacherAttendance, org_id, today)

    trend_start = today - timedelta(days=TREND_DAYS - 1)
    trend_rows = (
        db.query(
            models.StudentAttendance.attendance_date,
            func.count(models.StudentAttendance.id),
            _present_sum(models.StudentAttendance),
            _absent_sum(models.StudentAttendance),
            _late_sum(models.StudentAttendance),
        )
        .filter(
            models.StudentAttendance.organization_id == org_id,
            models.StudentAttendance.attendance_date >= trend_start,
        )
        .group_by(models.StudentAttendance.attendance_date)
        .all()
    )
    trend_by_date = {
        row[0]: _totals_from_counts(int(row[2] or 0), int(row[3] or 0), int(row[4] or 0))
        for row in trend_rows
    }
    trend = []
    for day in _trend_dates():
        day_totals = trend_by_date.get(day, _empty_totals())
        trend.append(
            schemas.AttendanceTrendPoint(
                date=day,
                label=day.strftime("%a"),
                percent=day_totals.percent,
                recorded=day_totals.total > 0,
                present=day_totals.present,
                absent=day_totals.absent,
                late=day_totals.late,
                total=day_totals.total,
            )
        )

    class_rows = (
        db.query(
            models.SchoolClass.id,
            models.SchoolClass.name,
            func.count(models.Student.id),
        )
        .outerjoin(
            models.Student,
            (models.Student.class_id == models.SchoolClass.id)
            & (models.Student.organization_id == org_id),
        )
        .filter(models.SchoolClass.organization_id == org_id)
        .group_by(models.SchoolClass.id, models.SchoolClass.name)
        .order_by(func.count(models.Student.id).desc(), models.SchoolClass.name.asc())
        .all()
    )
    by_class = [
        schemas.AdminClassDistribution(
            class_id=row[0],
            class_name=row[1],
            count=int(row[2] or 0),
            percent=round(((row[2] or 0) / total_students) * 100, 1) if total_students else 0.0,
        )
        for row in class_rows[:6]
    ]

    top_rows = (
        db.query(
            models.Student.id,
            models.Student.full_name,
            models.SchoolClass.name,
            models.Section.name,
            models.User.avatar_url,
            func.count(models.StudentAttendance.id),
            _present_sum(models.StudentAttendance),
            _late_sum(models.StudentAttendance),
        )
        .join(models.StudentAttendance, models.StudentAttendance.student_id == models.Student.id)
        .join(models.SchoolClass, models.SchoolClass.id == models.Student.class_id)
        .join(models.Section, models.Section.id == models.Student.section_id)
        .outerjoin(models.User, models.User.id == models.Student.user_id)
        .filter(models.StudentAttendance.organization_id == org_id)
        .group_by(
            models.Student.id,
            models.Student.full_name,
            models.SchoolClass.name,
            models.Section.name,
            models.User.avatar_url,
        )
        .all()
    )
    top_students = sorted(
        [
            schemas.AdminTopStudent(
                id=row[0],
                full_name=row[1],
                class_name=row[2] or "",
                section_name=row[3] or "",
                avatar_url=row[4],
                attendance_percent=_totals_from_counts(
                    int(row[6] or 0),
                    max(int(row[5] or 0) - int(row[6] or 0) - int(row[7] or 0), 0),
                    int(row[7] or 0),
                ).percent,
                total_days=int(row[5] or 0),
            )
            for row in top_rows
        ],
        key=lambda item: (item.attendance_percent, item.total_days),
        reverse=True,
    )[:5]

    recent_student_rows = (
        db.query(models.Student)
        .options(
            joinedload(models.Student.school_class),
            joinedload(models.Student.section),
            joinedload(models.Student.user),
        )
        .filter(models.Student.organization_id == org_id)
        .order_by(models.Student.created_at.desc())
        .limit(RECENT_LIMIT)
        .all()
    )
    recent_students = [
        schemas.AdminRecentStudent(
            id=student.id,
            full_name=student.full_name,
            class_name=student.school_class.name if student.school_class else "",
            section_name=student.section.name if student.section else "",
            created_at=student.created_at,
            avatar_url=student.user.avatar_url if student.user else None,
        )
        for student in recent_student_rows
    ]

    recent_day_rows = (
        db.query(
            models.StudentAttendance.attendance_date,
            models.SchoolClass.name,
            models.Section.name,
            func.count(models.StudentAttendance.id),
            _present_sum(models.StudentAttendance),
            _absent_sum(models.StudentAttendance),
            _late_sum(models.StudentAttendance),
        )
        .join(models.SchoolClass, models.SchoolClass.id == models.StudentAttendance.class_id)
        .join(models.Section, models.Section.id == models.StudentAttendance.section_id)
        .filter(models.StudentAttendance.organization_id == org_id)
        .group_by(
            models.StudentAttendance.attendance_date,
            models.SchoolClass.name,
            models.Section.name,
        )
        .order_by(models.StudentAttendance.attendance_date.desc())
        .limit(RECENT_LIMIT)
        .all()
    )
    recent_class_days = [
        schemas.AdminRecentClassDay(
            attendance_date=row[0],
            class_name=row[1] or "",
            section_name=row[2] or "",
            total_students=int(row[3] or 0),
            present_count=int(row[4] or 0),
            absent_count=int(row[5] or 0),
            late_count=int(row[6] or 0),
            percent=_totals_from_counts(int(row[4] or 0), int(row[5] or 0), int(row[6] or 0)).percent,
        )
        for row in recent_day_rows
    ]

    return schemas.AdminDashboardData(
        academic_year=_academic_year(today),
        total_students=total_students,
        active_students=active_students,
        total_teachers=total_teachers,
        active_teachers=active_teachers,
        total_parents=int(total_parents),
        active_classes=int(active_classes),
        today_student=today_student,
        student_attendance=student_attendance,
        today_teacher=today_teacher,
        teacher_attendance=teacher_attendance,
        trend=trend,
        by_class=by_class,
        top_students=top_students,
        recent_students=recent_students,
        recent_class_days=recent_class_days,
    )


@router.get("/api/dashboard", response_model=schemas.RoleDashboardResponse)
def get_role_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "dashboard", "view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view the dashboard",
        )

    role = current_user.role
    if role == "superadmin" or not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This dashboard is only available inside an organization",
        )

    org_id = require_organization_id(current_user)
    if role == "teacher":
        return schemas.RoleDashboardResponse(role="teacher", teacher=_teacher_dashboard(db, current_user, org_id))
    if role == "student":
        return schemas.RoleDashboardResponse(role="student", student=_student_dashboard(db, current_user, org_id))
    if role == "parent":
        return schemas.RoleDashboardResponse(role="parent", parent=_parent_dashboard(db, current_user, org_id))
    return schemas.RoleDashboardResponse(role="admin", admin=_admin_dashboard(db, org_id))
