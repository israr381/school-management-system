from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db

router = APIRouter(tags=["teachers"])


def _require_admin_org(current_user: models.User) -> int:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school admins can manage teachers",
        )
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization",
        )
    return current_user.organization_id


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


def _teacher_response(teacher: models.Teacher) -> schemas.TeacherResponse:
    return schemas.TeacherResponse(
        id=teacher.id,
        full_name=teacher.full_name,
        email=teacher.email,
        phone=teacher.phone,
        address=teacher.address,
        subject=teacher.subject,
        status=teacher.status,
        created_at=teacher.created_at,
    )


def _teacher_query(db: Session, org_id: int):
    return (
        db.query(models.Teacher)
        .options(joinedload(models.Teacher.user))
        .filter(models.Teacher.organization_id == org_id)
    )


def _get_org_teacher(db: Session, teacher_id: int, org_id: int) -> models.Teacher:
    teacher = _teacher_query(db, org_id).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return teacher


@router.get("/api/teachers/stats", response_model=schemas.TeacherStatsResponse)
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    base = db.query(models.Teacher).filter(models.Teacher.organization_id == org_id)

    return schemas.TeacherStatsResponse(
        total_teachers=base.count(),
        active_teachers=base.filter(models.Teacher.status == "active").count(),
        disabled_teachers=base.filter(models.Teacher.status == "disabled").count(),
    )


@router.get("/api/teachers", response_model=List[schemas.TeacherResponse])
def list_teachers(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    query = _teacher_query(db, org_id)

    if status_filter in {"active", "disabled"}:
        query = query.filter(models.Teacher.status == status_filter)

    teachers = query.order_by(models.Teacher.created_at.desc()).all()
    return [_teacher_response(teacher) for teacher in teachers]


@router.post("/api/teachers", response_model=schemas.TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    payload: schemas.TeacherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    teacher_email = payload.email.strip().lower()

    existing_user = db.query(models.User).filter(models.User.email == teacher_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher email is already registered",
        )

    teacher_role = _get_or_create_role(db, "teacher")
    teacher_user = models.User(
        email=teacher_email,
        password_hash=auth.hash_password(auth.DEFAULT_ADMIN_PASSWORD),
        full_name=payload.full_name.strip(),
        role_id=teacher_role.id,
        organization_id=org_id,
        must_change_password=True,
    )
    db.add(teacher_user)
    db.flush()

    teacher = models.Teacher(
        user_id=teacher_user.id,
        organization_id=org_id,
        full_name=payload.full_name.strip(),
        email=teacher_email,
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        subject=_clean_text(payload.subject),
        status="active",
    )
    db.add(teacher)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create teacher. Email may already be registered.",
        )

    created = _teacher_query(db, org_id).filter(models.Teacher.id == teacher.id).first()
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Teacher was created but could not be loaded",
        )
    return _teacher_response(created)


@router.get("/api/teachers/{teacher_id}", response_model=schemas.TeacherResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    return _teacher_response(_get_org_teacher(db, teacher_id, org_id))


@router.put("/api/teachers/{teacher_id}", response_model=schemas.TeacherResponse)
def update_teacher(
    teacher_id: int,
    payload: schemas.TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    teacher = _get_org_teacher(db, teacher_id, org_id)
    teacher_email = payload.email.strip().lower()

    if teacher_email != teacher.email:
        existing_user = (
            db.query(models.User)
            .filter(models.User.email == teacher_email, models.User.id != teacher.user_id)
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher email is already registered",
            )

    teacher.full_name = payload.full_name.strip()
    teacher.email = teacher_email
    teacher.phone = payload.phone.strip()
    teacher.address = payload.address.strip()
    teacher.subject = _clean_text(payload.subject)
    teacher.status = payload.status
    if teacher.user:
        teacher.user.full_name = teacher.full_name
        teacher.user.email = teacher_email
        teacher.user.is_active = payload.status != "disabled"

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update teacher. Email may already be registered.",
        )

    return _teacher_response(_get_org_teacher(db, teacher_id, org_id))


@router.delete("/api/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    teacher = _get_org_teacher(db, teacher_id, org_id)
    teacher_user = teacher.user
    if teacher_user:
        db.delete(teacher_user)
    else:
        db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully", "teacher_id": teacher_id}
