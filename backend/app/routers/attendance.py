from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db
from app.permissions import has_permission, require_org_permission, require_organization_id

router = APIRouter(tags=["attendance"])


def _ensure_not_future_date(attendance_date: date) -> None:
    if attendance_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance cannot be taken for a future date",
        )


def _counts(records: list) -> tuple[int, int, int, int]:
    present = sum(1 for item in records if item.status == "present")
    absent = sum(1 for item in records if item.status == "absent")
    late = sum(1 for item in records if item.status == "late")
    leave = sum(1 for item in records if item.status == "leave")
    return present, absent, late, leave


def _get_teacher_assignment(
    db: Session, user: models.User, org_id: int
) -> Optional[models.TeacherClassAssignment]:
    teacher = (
        db.query(models.Teacher)
        .options(joinedload(models.Teacher.class_assignment))
        .filter(models.Teacher.user_id == user.id, models.Teacher.organization_id == org_id)
        .first()
    )
    if not teacher:
        return None
    return teacher.class_assignment


def _student_class_scope(
    db: Session,
    user: models.User,
    org_id: int,
    class_id: Optional[int],
    section_id: Optional[int],
) -> tuple[models.SchoolClass, models.Section, bool]:
    if user.role != "admin":
        assignment = _get_teacher_assignment(db, user, org_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to a class. Ask an admin to assign a class first.",
            )
        school_class = assignment.school_class
        section = assignment.section
        if not school_class:
            school_class = (
                db.query(models.SchoolClass)
                .filter(models.SchoolClass.id == assignment.class_id)
                .first()
            )
        if not section:
            section = db.query(models.Section).filter(models.Section.id == assignment.section_id).first()
        if not school_class or not section:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned class not found")
        return school_class, section, True

    if not class_id or not section_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a class and section",
        )
    school_class = (
        db.query(models.SchoolClass)
        .filter(models.SchoolClass.id == class_id, models.SchoolClass.organization_id == org_id)
        .first()
    )
    if not school_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    section = (
        db.query(models.Section)
        .filter(models.Section.id == section_id, models.Section.organization_id == org_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    if section.class_id != school_class.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected section does not belong to the selected class",
        )
    return school_class, section, False


def _present_sum(model):
    return func.coalesce(func.sum(case((model.status == "present", 1), else_=0)), 0)


def _absent_sum(model):
    return func.coalesce(func.sum(case((model.status == "absent", 1), else_=0)), 0)


def _late_sum(model):
    return func.coalesce(func.sum(case((model.status == "late", 1), else_=0)), 0)


def _leave_sum(model):
    return func.coalesce(func.sum(case((model.status == "leave", 1), else_=0)), 0)


def _approved_leave_ids(
    db: Session,
    org_id: int,
    attendance_date: date,
    *,
    student_ids: Optional[list[int]] = None,
    teacher_ids: Optional[list[int]] = None,
) -> set[int]:
    query = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.organization_id == org_id,
        models.LeaveRequest.status == "approved",
        models.LeaveRequest.from_date <= attendance_date,
        models.LeaveRequest.to_date >= attendance_date,
    )
    if student_ids is not None:
        if not student_ids:
            return set()
        rows = query.filter(models.LeaveRequest.student_id.in_(student_ids)).all()
        return {row.student_id for row in rows if row.student_id}
    if teacher_ids is not None:
        if not teacher_ids:
            return set()
        rows = query.filter(models.LeaveRequest.teacher_id.in_(teacher_ids)).all()
        return {row.teacher_id for row in rows if row.teacher_id}
    return set()


@router.get("/api/student-attendance/history", response_model=List[schemas.StudentAttendanceSummary])
def list_student_attendance_history(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("student_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = (
        db.query(
            models.StudentAttendance.attendance_date,
            models.StudentAttendance.class_id,
            models.SchoolClass.name.label("class_name"),
            models.StudentAttendance.section_id,
            models.Section.name.label("section_name"),
            func.count(models.StudentAttendance.id).label("total_students"),
            _present_sum(models.StudentAttendance).label("present_count"),
            _absent_sum(models.StudentAttendance).label("absent_count"),
            _late_sum(models.StudentAttendance).label("late_count"),
            _leave_sum(models.StudentAttendance).label("leave_count"),
        )
        .join(models.SchoolClass, models.SchoolClass.id == models.StudentAttendance.class_id)
        .join(models.Section, models.Section.id == models.StudentAttendance.section_id)
        .filter(models.StudentAttendance.organization_id == org_id)
    )
    if current_user.role != "admin":
        assignment = _get_teacher_assignment(db, current_user, org_id)
        if not assignment:
            return []
        query = query.filter(
            models.StudentAttendance.class_id == assignment.class_id,
            models.StudentAttendance.section_id == assignment.section_id,
        )

    rows = (
        query.group_by(
            models.StudentAttendance.attendance_date,
            models.StudentAttendance.class_id,
            models.SchoolClass.name,
            models.StudentAttendance.section_id,
            models.Section.name,
        )
        .order_by(models.StudentAttendance.attendance_date.desc())
        .all()
    )
    can_edit = has_permission(current_user, "student_attendance", "update")
    return [
        schemas.StudentAttendanceSummary(
            attendance_date=row.attendance_date,
            class_id=row.class_id,
            class_name=row.class_name,
            section_id=row.section_id,
            section_name=row.section_name,
            total_students=int(row.total_students or 0),
            present_count=int(row.present_count or 0),
            absent_count=int(row.absent_count or 0),
            late_count=int(row.late_count or 0),
            leave_count=int(row.leave_count or 0),
            can_edit=can_edit,
        )
        for row in rows
    ]


def _can_delete_student_attendance(user: models.User) -> bool:
    return has_permission(user, "student_attendance", "delete")


@router.delete("/api/student-attendance")
def delete_student_attendance(
    attendance_date: date = Query(...),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("student_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not _can_delete_student_attendance(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete student attendance",
        )
    school_class, section, _locked = _student_class_scope(
        db, current_user, org_id, class_id, section_id
    )
    deleted = models.bulk_soft_delete(
        db,
        models.StudentAttendance,
        models.StudentAttendance.organization_id == org_id,
        models.StudentAttendance.class_id == school_class.id,
        models.StudentAttendance.section_id == section.id,
        models.StudentAttendance.attendance_date == attendance_date,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    db.commit()
    return {"message": "Attendance deleted successfully"}


@router.get("/api/student-attendance", response_model=schemas.StudentAttendanceSheet)
def get_student_attendance(
    attendance_date: date = Query(...),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("student_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    school_class, section, locked = _student_class_scope(
        db, current_user, org_id, class_id, section_id
    )
    students = (
        db.query(models.Student)
        .filter(
            models.Student.organization_id == org_id,
            models.Student.class_id == school_class.id,
            models.Student.section_id == section.id,
            models.Student.status == "active",
        )
        .order_by(models.Student.full_name.asc())
        .all()
    )
    existing = {
        row.student_id: row.status
        for row in (
            db.query(models.StudentAttendance)
            .filter(
                models.StudentAttendance.organization_id == org_id,
                models.StudentAttendance.class_id == school_class.id,
                models.StudentAttendance.section_id == section.id,
                models.StudentAttendance.attendance_date == attendance_date,
            )
            .all()
        )
    }
    is_saved = bool(existing)
    can_edit = (
        has_permission(current_user, "student_attendance", "update")
        if is_saved
        else has_permission(current_user, "student_attendance", "take")
    )
    on_leave_ids = _approved_leave_ids(
        db, org_id, attendance_date, student_ids=[student.id for student in students]
    )
    records = []
    for student in students:
        on_leave = student.id in on_leave_ids
        if student.id in existing:
            status = existing[student.id]
        else:
            status = "leave" if on_leave else "absent"
        records.append(
            schemas.StudentAttendanceRecordOut(
                student_id=student.id,
                full_name=student.full_name,
                status=status,
                on_leave=on_leave,
            )
        )
    present_count, absent_count, late_count, leave_count = _counts(records)
    return schemas.StudentAttendanceSheet(
        attendance_date=attendance_date,
        class_id=school_class.id,
        class_name=school_class.name,
        section_id=section.id,
        section_name=section.name,
        locked=locked,
        is_saved=is_saved,
        can_edit=can_edit,
        present_count=present_count if is_saved else 0,
        absent_count=absent_count if is_saved else 0,
        late_count=late_count if is_saved else 0,
        leave_count=leave_count if is_saved else 0,
        records=records,
    )


@router.post("/api/student-attendance", response_model=schemas.StudentAttendanceSheet)
def save_student_attendance(
    payload: schemas.StudentAttendanceSave,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("student_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    school_class, section, _locked = _student_class_scope(
        db, current_user, org_id, payload.class_id, payload.section_id
    )
    _ensure_not_future_date(payload.attendance_date)
    existing_rows = (
        db.query(models.StudentAttendance)
        .filter(
            models.StudentAttendance.organization_id == org_id,
            models.StudentAttendance.class_id == school_class.id,
            models.StudentAttendance.section_id == section.id,
            models.StudentAttendance.attendance_date == payload.attendance_date,
        )
        .all()
    )
    if existing_rows:
        if not has_permission(current_user, "student_attendance", "update"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit student attendance",
            )
    elif not has_permission(current_user, "student_attendance", "take"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to take student attendance",
        )

    valid_students = {
        student.id: student
        for student in (
            db.query(models.Student)
            .filter(
                models.Student.organization_id == org_id,
                models.Student.class_id == school_class.id,
                models.Student.section_id == section.id,
                models.Student.status == "active",
            )
            .all()
        )
    }
    existing_by_student = {row.student_id: row for row in existing_rows}
    now = datetime.utcnow()

    for record in payload.records:
        student = valid_students.get(record.student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more students are not in the selected class and section",
            )
        row = existing_by_student.get(student.id)
        if row:
            row.status = record.status
            row.updated_at = now
            row.marked_by_user_id = current_user.id
        else:
            db.add(
                models.StudentAttendance(
                    student_id=student.id,
                    class_id=school_class.id,
                    section_id=section.id,
                    organization_id=org_id,
                    attendance_date=payload.attendance_date,
                    status=record.status,
                    marked_by_user_id=current_user.id,
                    created_at=now,
                    updated_at=now,
                )
            )

    db.commit()
    return get_student_attendance(
        attendance_date=payload.attendance_date,
        class_id=school_class.id,
        section_id=section.id,
        db=db,
        org_id=org_id,
        current_user=current_user,
    )


@router.get("/api/teacher-attendance/history", response_model=List[schemas.TeacherAttendanceSummary])
def list_teacher_attendance_history(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teacher_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    rows = (
        db.query(
            models.TeacherAttendance.attendance_date,
            func.count(models.TeacherAttendance.id).label("total_teachers"),
            _present_sum(models.TeacherAttendance).label("present_count"),
            _absent_sum(models.TeacherAttendance).label("absent_count"),
            _late_sum(models.TeacherAttendance).label("late_count"),
            _leave_sum(models.TeacherAttendance).label("leave_count"),
        )
        .filter(models.TeacherAttendance.organization_id == org_id)
        .group_by(models.TeacherAttendance.attendance_date)
        .order_by(models.TeacherAttendance.attendance_date.desc())
        .all()
    )
    can_edit = has_permission(current_user, "teacher_attendance", "update")
    return [
        schemas.TeacherAttendanceSummary(
            attendance_date=row.attendance_date,
            total_teachers=int(row.total_teachers or 0),
            present_count=int(row.present_count or 0),
            absent_count=int(row.absent_count or 0),
            late_count=int(row.late_count or 0),
            leave_count=int(row.leave_count or 0),
            can_edit=can_edit,
        )
        for row in rows
    ]


def _can_delete_teacher_attendance(user: models.User) -> bool:
    return has_permission(user, "teacher_attendance", "delete")


@router.delete("/api/teacher-attendance")
def delete_teacher_attendance(
    attendance_date: date = Query(...),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teacher_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not _can_delete_teacher_attendance(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete teacher attendance",
        )
    deleted = models.bulk_soft_delete(
        db,
        models.TeacherAttendance,
        models.TeacherAttendance.organization_id == org_id,
        models.TeacherAttendance.attendance_date == attendance_date,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    db.commit()
    return {"message": "Attendance deleted successfully"}


@router.get("/api/teacher-attendance", response_model=schemas.TeacherAttendanceSheet)
def get_teacher_attendance(
    attendance_date: date = Query(...),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teacher_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    teachers = (
        db.query(models.Teacher)
        .filter(models.Teacher.organization_id == org_id, models.Teacher.status == "active")
        .order_by(models.Teacher.full_name.asc())
        .all()
    )
    existing = {
        row.teacher_id: row.status
        for row in (
            db.query(models.TeacherAttendance)
            .filter(
                models.TeacherAttendance.organization_id == org_id,
                models.TeacherAttendance.attendance_date == attendance_date,
            )
            .all()
        )
    }
    is_saved = bool(existing)
    can_edit = (
        has_permission(current_user, "teacher_attendance", "update")
        if is_saved
        else has_permission(current_user, "teacher_attendance", "take")
    )
    on_leave_ids = _approved_leave_ids(
        db, org_id, attendance_date, teacher_ids=[teacher.id for teacher in teachers]
    )
    records = []
    for teacher in teachers:
        on_leave = teacher.id in on_leave_ids
        if teacher.id in existing:
            status = existing[teacher.id]
        else:
            status = "leave" if on_leave else "absent"
        records.append(
            schemas.TeacherAttendanceRecordOut(
                teacher_id=teacher.id,
                full_name=teacher.full_name,
                status=status,
                on_leave=on_leave,
            )
        )
    present_count, absent_count, late_count, leave_count = _counts(records)
    return schemas.TeacherAttendanceSheet(
        attendance_date=attendance_date,
        is_saved=is_saved,
        can_edit=can_edit,
        present_count=present_count if is_saved else 0,
        absent_count=absent_count if is_saved else 0,
        late_count=late_count if is_saved else 0,
        leave_count=leave_count if is_saved else 0,
        records=records,
    )


@router.post("/api/teacher-attendance", response_model=schemas.TeacherAttendanceSheet)
def save_teacher_attendance(
    payload: schemas.TeacherAttendanceSave,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teacher_attendance", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    _ensure_not_future_date(payload.attendance_date)
    existing_rows = (
        db.query(models.TeacherAttendance)
        .filter(
            models.TeacherAttendance.organization_id == org_id,
            models.TeacherAttendance.attendance_date == payload.attendance_date,
        )
        .all()
    )
    if existing_rows:
        if not has_permission(current_user, "teacher_attendance", "update"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit teacher attendance",
            )
    elif not has_permission(current_user, "teacher_attendance", "take"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to take teacher attendance",
        )

    valid_teachers = {
        teacher.id: teacher
        for teacher in (
            db.query(models.Teacher)
            .filter(models.Teacher.organization_id == org_id, models.Teacher.status == "active")
            .all()
        )
    }
    existing_by_teacher = {row.teacher_id: row for row in existing_rows}
    now = datetime.utcnow()

    for record in payload.records:
        teacher = valid_teachers.get(record.teacher_id)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more teachers were not found",
            )
        row = existing_by_teacher.get(teacher.id)
        if row:
            row.status = record.status
            row.updated_at = now
            row.marked_by_user_id = current_user.id
        else:
            db.add(
                models.TeacherAttendance(
                    teacher_id=teacher.id,
                    organization_id=org_id,
                    attendance_date=payload.attendance_date,
                    status=record.status,
                    marked_by_user_id=current_user.id,
                    created_at=now,
                    updated_at=now,
                )
            )

    db.commit()
    return get_teacher_attendance(
        attendance_date=payload.attendance_date,
        db=db,
        org_id=org_id,
        current_user=current_user,
    )


@router.get("/api/my-attendance", response_model=schemas.MyAttendanceResponse)
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "my_attendance", "view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view my attendance",
        )
    org_id = require_organization_id(current_user)

    student = (
        db.query(models.Student)
        .options(joinedload(models.Student.school_class), joinedload(models.Student.section))
        .filter(models.Student.user_id == current_user.id, models.Student.organization_id == org_id)
        .first()
    )
    if student:
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
        return schemas.MyAttendanceResponse(
            person_type="student",
            full_name=student.full_name,
            records=[
                schemas.MyAttendanceRecord(
                    attendance_date=row.attendance_date,
                    status=row.status,
                    class_name=row.school_class.name if row.school_class else None,
                    section_name=row.section.name if row.section else None,
                )
                for row in rows
            ],
        )

    teacher = (
        db.query(models.Teacher)
        .filter(models.Teacher.user_id == current_user.id, models.Teacher.organization_id == org_id)
        .first()
    )
    if teacher:
        rows = (
            db.query(models.TeacherAttendance)
            .filter(models.TeacherAttendance.teacher_id == teacher.id)
            .order_by(models.TeacherAttendance.attendance_date.desc())
            .all()
        )
        return schemas.MyAttendanceResponse(
            person_type="teacher",
            full_name=teacher.full_name,
            records=[
                schemas.MyAttendanceRecord(
                    attendance_date=row.attendance_date,
                    status=row.status,
                )
                for row in rows
            ],
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No attendance profile found for this account",
    )
