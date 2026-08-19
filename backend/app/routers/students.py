from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db
from app.permissions import require_org_permission

router = APIRouter(tags=["students"])


def _clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _get_or_create_role(db: Session, role_name: str) -> models.Role:
    role = db.query(models.Role).filter(models.Role.name == role_name).first()
    if not role:
        role = models.Role(name=role_name)
        db.add(role)
        db.flush()
    return role


def _student_response(student: models.Student) -> schemas.StudentResponse:
    parent = student.parent
    return schemas.StudentResponse(
        id=student.id,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        address=student.address,
        status=student.status,
        avatar_url=student.user.avatar_url if student.user else None,
        class_id=student.class_id,
        class_name=student.school_class.name if student.school_class else "",
        section_id=student.section_id,
        section_name=student.section.name if student.section else "",
        created_at=student.created_at,
        parent=schemas.ParentResponse(
            id=parent.id,
            full_name=parent.full_name,
            email=parent.email,
            phone=parent.phone,
            relationship=parent.relationship,
            address=parent.address,
        ),
    )


def _require_new_parent_fields(payload: schemas.StudentCreate) -> None:
    if not payload.parent_full_name or not payload.parent_full_name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent name is required")
    if not payload.parent_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent email is required")
    if not payload.parent_phone or len(payload.parent_phone.strip()) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent phone is required")
    if payload.parent_relationship not in {"father", "guardian"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent relationship is required")


def _get_existing_parent(db: Session, org_id: int, parent_id: int) -> models.Parent:
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.id == parent_id, models.Parent.organization_id == org_id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    return parent


def _create_parent(
    db: Session,
    org_id: int,
    payload: schemas.StudentCreate,
    parent_role: models.Role,
) -> models.Parent:
    parent_email = payload.parent_email.strip().lower() if payload.parent_email else ""
    existing_parent = (
        db.query(models.Parent)
        .filter(
            models.Parent.email == parent_email,
            models.Parent.organization_id == org_id,
        )
        .first()
    )
    if existing_parent:
        return existing_parent

    existing_parent_user = db.query(models.User).filter(models.User.email == parent_email).first()
    if existing_parent_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent email is already registered",
        )

    parent_user = models.User(
        email=parent_email,
        password_hash=auth.hash_password(auth.DEFAULT_ADMIN_PASSWORD),
        full_name=payload.parent_full_name.strip(),
        role_id=parent_role.id,
        organization_id=org_id,
        must_change_password=True,
    )
    db.add(parent_user)
    db.flush()

    parent = models.Parent(
        user_id=parent_user.id,
        organization_id=org_id,
        full_name=payload.parent_full_name.strip(),
        email=parent_email,
        phone=payload.parent_phone.strip(),
        relationship=payload.parent_relationship or "father",
        address=_clean_text(payload.parent_address),
    )
    db.add(parent)
    db.flush()
    return parent


def _student_query(db: Session, org_id: int):
    return (
        db.query(models.Student)
        .options(
            joinedload(models.Student.parent).joinedload(models.Parent.user),
            joinedload(models.Student.school_class),
            joinedload(models.Student.section),
            joinedload(models.Student.user),
        )
        .filter(models.Student.organization_id == org_id)
    )


def _get_org_student(db: Session, student_id: int, org_id: int) -> models.Student:
    student = _student_query(db, org_id).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


def _get_class_and_section(db: Session, org_id: int, class_id: int, section_id: int):
    school_class = (
        db.query(models.SchoolClass)
        .filter(
            models.SchoolClass.id == class_id,
            models.SchoolClass.organization_id == org_id,
        )
        .first()
    )
    if not school_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    section = (
        db.query(models.Section)
        .filter(
            models.Section.id == section_id,
            models.Section.class_id == class_id,
            models.Section.organization_id == org_id,
        )
        .first()
    )
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found for the selected class",
        )
    return school_class, section


@router.get("/api/students/stats", response_model=schemas.StudentStatsResponse)
def get_student_stats(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "view")),
):
    base = db.query(models.Student).filter(models.Student.organization_id == org_id)

    total_students = base.count()
    active_students = base.filter(models.Student.status == "active").count()
    graduated_students = base.filter(models.Student.status == "graduated").count()
    disabled_students = base.filter(models.Student.status == "disabled").count()

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
        .order_by(models.SchoolClass.name.asc())
        .all()
    )

    return schemas.StudentStatsResponse(
        total_students=total_students,
        active_students=active_students,
        graduated_students=graduated_students,
        disabled_students=disabled_students,
        by_class=[
            schemas.ClassStudentCount(class_id=row[0], class_name=row[1], count=row[2] or 0)
            for row in class_rows
        ],
    )


@router.get("/api/students", response_model=List[schemas.StudentResponse])
def list_students(
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "view")),
):
    query = _student_query(db, org_id)

    if class_id:
        query = query.filter(models.Student.class_id == class_id)
    if section_id:
        query = query.filter(models.Student.section_id == section_id)
    if status_filter in {"active", "graduated", "disabled"}:
        query = query.filter(models.Student.status == status_filter)

    students = query.order_by(models.Student.created_at.desc()).all()
    return [_student_response(student) for student in students]


@router.get("/api/parents", response_model=List[schemas.ParentResponse])
def list_parents(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "view")),
):
    rows = (
        db.query(models.Parent, func.count(models.Student.id))
        .outerjoin(models.Student, models.Student.parent_id == models.Parent.id)
        .filter(models.Parent.organization_id == org_id)
        .group_by(models.Parent.id)
        .order_by(models.Parent.full_name.asc())
        .all()
    )
    return [
        schemas.ParentResponse(
            id=parent.id,
            full_name=parent.full_name,
            email=parent.email,
            phone=parent.phone,
            relationship=parent.relationship,
            address=parent.address,
            student_count=count or 0,
        )
        for parent, count in rows
    ]


@router.post("/api/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "create")),
):

    student_email = payload.email.strip().lower()
    _get_class_and_section(db, org_id, payload.class_id, payload.section_id)

    existing_student_user = db.query(models.User).filter(models.User.email == student_email).first()
    if existing_student_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student email is already registered",
        )

    student_role = _get_or_create_role(db, "student")
    parent_role = _get_or_create_role(db, "parent")

    if payload.parent_id:
        parent = _get_existing_parent(db, org_id, payload.parent_id)
        if parent.email == student_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student and parent emails must be different",
            )
    else:
        _require_new_parent_fields(payload)
        parent_email = payload.parent_email.strip().lower()
        if student_email == parent_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student and parent emails must be different",
            )
        parent = _create_parent(db, org_id, payload, parent_role)

    student_user = models.User(
        email=student_email,
        password_hash=auth.hash_password(auth.DEFAULT_ADMIN_PASSWORD),
        full_name=payload.full_name.strip(),
        role_id=student_role.id,
        organization_id=org_id,
        must_change_password=True,
    )
    db.add(student_user)
    db.flush()

    student = models.Student(
        user_id=student_user.id,
        parent_id=parent.id,
        organization_id=org_id,
        class_id=payload.class_id,
        section_id=payload.section_id,
        full_name=payload.full_name.strip(),
        email=student_email,
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        status="active",
    )
    db.add(student)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create student. Email may already be registered.",
        )

    created = _student_query(db, org_id).filter(models.Student.id == student.id).first()
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Student was created but could not be loaded",
        )
    return _student_response(created)


@router.get("/api/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "view")),
):
    return _student_response(_get_org_student(db, student_id, org_id))


@router.put("/api/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "update")),
):
    student = _get_org_student(db, student_id, org_id)
    parent = student.parent

    student_email = payload.email.strip().lower()
    _get_class_and_section(db, org_id, payload.class_id, payload.section_id)

    if student_email != student.email:
        existing_student_user = (
            db.query(models.User)
            .filter(models.User.email == student_email, models.User.id != student.user_id)
            .first()
        )
        if existing_student_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student email is already registered",
            )

    if payload.parent_id:
        parent = _get_existing_parent(db, org_id, payload.parent_id)
        if parent.email == student_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student and parent emails must be different",
            )
        student.parent_id = parent.id
    else:
        _require_new_parent_fields(payload)
        parent_email = payload.parent_email.strip().lower()
        if student_email == parent_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student and parent emails must be different",
            )

        if parent_email != parent.email:
            existing_parent = (
                db.query(models.Parent)
                .filter(
                    models.Parent.email == parent_email,
                    models.Parent.organization_id == org_id,
                    models.Parent.id != parent.id,
                )
                .first()
            )
            if existing_parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent email is already registered",
                )
            existing_parent_user = (
                db.query(models.User)
                .filter(models.User.email == parent_email, models.User.id != parent.user_id)
                .first()
            )
            if existing_parent_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent email is already registered",
                )

        parent.full_name = payload.parent_full_name.strip()
        parent.email = parent_email
        parent.phone = payload.parent_phone.strip()
        parent.relationship = payload.parent_relationship or parent.relationship
        parent.address = _clean_text(payload.parent_address)
        if parent.user:
            parent.user.full_name = parent.full_name
            parent.user.email = parent_email

    student.full_name = payload.full_name.strip()
    student.email = student_email
    student.phone = payload.phone.strip()
    student.address = payload.address.strip()
    student.class_id = payload.class_id
    student.section_id = payload.section_id
    student.status = payload.status
    if student.user:
        student.user.full_name = student.full_name
        student.user.email = student_email
        student.user.is_active = payload.status != "disabled"

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update student. Email may already be registered.",
        )

    updated = _get_org_student(db, student_id, org_id)
    return _student_response(updated)


@router.delete("/api/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("students", "delete")),
):
    student = _get_org_student(db, student_id, org_id)
    student_user = student.user
    if student_user:
        db.delete(student_user)
    else:
        db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully", "student_id": student_id}
