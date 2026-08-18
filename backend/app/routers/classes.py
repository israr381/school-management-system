from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db

router = APIRouter(tags=["classes"])


def _require_admin_org(current_user: models.User) -> int:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school admins can manage classes and sections",
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


def _section_response(section: models.Section, student_count: int = 0) -> schemas.SectionResponse:
    class_name = section.school_class.name if section.school_class else ""
    return schemas.SectionResponse(
        id=section.id,
        name=section.name,
        class_id=section.class_id,
        class_name=class_name,
        student_count=student_count,
        created_at=section.created_at,
        updated_at=section.updated_at,
    )


def _class_response(
    school_class: models.SchoolClass,
    section_count: int,
    student_count: int = 0,
) -> schemas.ClassResponse:
    return schemas.ClassResponse(
        id=school_class.id,
        name=school_class.name,
        description=school_class.description,
        section_count=section_count,
        student_count=student_count,
        created_at=school_class.created_at,
        updated_at=school_class.updated_at,
    )


def _student_count_for_class(db: Session, class_id: int) -> int:
    return (
        db.query(func.count(models.Student.id))
        .filter(models.Student.class_id == class_id)
        .scalar()
        or 0
    )


def _student_count_for_section(db: Session, section_id: int) -> int:
    return (
        db.query(func.count(models.Student.id))
        .filter(models.Student.section_id == section_id)
        .scalar()
        or 0
    )


def _section_count(db: Session, class_id: int) -> int:
    return (
        db.query(func.count(models.Section.id))
        .filter(models.Section.class_id == class_id)
        .scalar()
        or 0
    )


def _get_org_class(db: Session, class_id: int, org_id: int) -> models.SchoolClass:
    school_class = (
        db.query(models.SchoolClass)
        .filter(
            models.SchoolClass.id == class_id,
            models.SchoolClass.organization_id == org_id,
        )
        .first()
    )
    if not school_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )
    return school_class


def _get_org_section(db: Session, section_id: int, org_id: int) -> models.Section:
    section = (
        db.query(models.Section)
        .options(joinedload(models.Section.school_class))
        .filter(
            models.Section.id == section_id,
            models.Section.organization_id == org_id,
        )
        .first()
    )
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found",
        )
    return section


@router.get("/api/classes", response_model=List[schemas.ClassResponse])
def list_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    classes = (
        db.query(models.SchoolClass)
        .filter(models.SchoolClass.organization_id == org_id)
        .order_by(models.SchoolClass.created_at.desc())
        .all()
    )
    counts = dict(
        db.query(models.Section.class_id, func.count(models.Section.id))
        .filter(models.Section.organization_id == org_id)
        .group_by(models.Section.class_id)
        .all()
    )
    student_counts = dict(
        db.query(models.Student.class_id, func.count(models.Student.id))
        .filter(models.Student.organization_id == org_id)
        .group_by(models.Student.class_id)
        .all()
    )
    return [
        _class_response(
            school_class,
            counts.get(school_class.id, 0),
            student_counts.get(school_class.id, 0),
        )
        for school_class in classes
    ]


@router.post("/api/classes", response_model=schemas.ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    name = data.name.strip()
    now = datetime.utcnow()
    school_class = models.SchoolClass(
        name=name,
        description=_clean_text(data.description),
        organization_id=org_id,
        created_at=now,
        updated_at=now,
    )
    db.add(school_class)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A class with this name already exists",
        )
    db.refresh(school_class)
    return _class_response(school_class, 0, 0)


@router.put("/api/classes/{class_id}", response_model=schemas.ClassResponse)
def update_class(
    class_id: int,
    data: schemas.ClassUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    school_class = _get_org_class(db, class_id, org_id)
    school_class.name = data.name.strip()
    school_class.description = _clean_text(data.description)
    school_class.updated_at = datetime.utcnow()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A class with this name already exists",
        )
    db.refresh(school_class)
    return _class_response(
        school_class,
        _section_count(db, school_class.id),
        _student_count_for_class(db, school_class.id),
    )


@router.delete("/api/classes/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    school_class = _get_org_class(db, class_id, org_id)
    student_count = (
        db.query(func.count(models.Student.id))
        .filter(models.Student.class_id == class_id)
        .scalar()
        or 0
    )
    if student_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a class that has students",
        )
    db.delete(school_class)
    db.commit()
    return {"message": "Class deleted successfully", "class_id": class_id}


@router.get("/api/sections", response_model=List[schemas.SectionResponse])
def list_sections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    sections = (
        db.query(models.Section)
        .options(joinedload(models.Section.school_class))
        .filter(models.Section.organization_id == org_id)
        .order_by(models.Section.created_at.desc())
        .all()
    )
    student_counts = dict(
        db.query(models.Student.section_id, func.count(models.Student.id))
        .filter(models.Student.organization_id == org_id)
        .group_by(models.Student.section_id)
        .all()
    )
    return [
        _section_response(section, student_counts.get(section.id, 0))
        for section in sections
    ]


@router.post("/api/sections", response_model=schemas.SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    data: schemas.SectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    school_class = _get_org_class(db, data.class_id, org_id)
    now = datetime.utcnow()
    section = models.Section(
        name=data.name.strip(),
        class_id=school_class.id,
        organization_id=org_id,
        created_at=now,
        updated_at=now,
    )
    db.add(section)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A section with this name already exists in the selected class",
        )
    db.refresh(section)
    section.school_class = school_class
    return _section_response(section, 0)


@router.put("/api/sections/{section_id}", response_model=schemas.SectionResponse)
def update_section(
    section_id: int,
    data: schemas.SectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    section = _get_org_section(db, section_id, org_id)
    school_class = _get_org_class(db, data.class_id, org_id)
    section.name = data.name.strip()
    section.class_id = school_class.id
    section.updated_at = datetime.utcnow()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A section with this name already exists in the selected class",
        )
    db.refresh(section)
    section.school_class = school_class
    return _section_response(section, _student_count_for_section(db, section.id))


@router.delete("/api/sections/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    org_id = _require_admin_org(current_user)
    section = _get_org_section(db, section_id, org_id)
    student_count = (
        db.query(func.count(models.Student.id))
        .filter(models.Student.section_id == section_id)
        .scalar()
        or 0
    )
    if student_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a section that has students",
        )
    db.delete(section)
    db.commit()
    return {"message": "Section deleted successfully", "section_id": section_id}
