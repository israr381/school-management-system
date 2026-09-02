from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db
from app.permissions import has_permission, require_org_permission, require_organization_id

router = APIRouter(tags=["teacher-assignments"])


def _assignment_response(assignment: models.TeacherClassAssignment) -> schemas.TeacherClassAssignmentResponse:
    teacher_name = assignment.teacher.full_name if assignment.teacher else ""
    class_name = assignment.school_class.name if assignment.school_class else ""
    section_name = assignment.section.name if assignment.section else ""
    return schemas.TeacherClassAssignmentResponse(
        id=assignment.id,
        teacher_id=assignment.teacher_id,
        teacher_name=teacher_name,
        class_id=assignment.class_id,
        class_name=class_name,
        section_id=assignment.section_id,
        section_name=section_name,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
    )


def _assignment_query(db: Session, org_id: int):
    return (
        db.query(models.TeacherClassAssignment)
        .options(
            joinedload(models.TeacherClassAssignment.teacher),
            joinedload(models.TeacherClassAssignment.school_class),
            joinedload(models.TeacherClassAssignment.section),
        )
        .filter(models.TeacherClassAssignment.organization_id == org_id)
    )


def _get_org_teacher(db: Session, teacher_id: int, org_id: int) -> models.Teacher:
    teacher = (
        db.query(models.Teacher)
        .filter(models.Teacher.id == teacher_id, models.Teacher.organization_id == org_id)
        .first()
    )
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return teacher


def _get_org_class(db: Session, class_id: int, org_id: int) -> models.SchoolClass:
    school_class = (
        db.query(models.SchoolClass)
        .filter(models.SchoolClass.id == class_id, models.SchoolClass.organization_id == org_id)
        .first()
    )
    if not school_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return school_class


def _get_org_section(db: Session, section_id: int, org_id: int) -> models.Section:
    section = (
        db.query(models.Section)
        .filter(models.Section.id == section_id, models.Section.organization_id == org_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


def _validate_class_section(
    db: Session, class_id: int, section_id: int, org_id: int
) -> tuple[models.SchoolClass, models.Section]:
    school_class = _get_org_class(db, class_id, org_id)
    section = _get_org_section(db, section_id, org_id)
    if section.class_id != school_class.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected section does not belong to the selected class",
        )
    return school_class, section


@router.get(
    "/api/teacher-assignments/me",
    response_model=schemas.TeacherClassAssignmentResponse,
)
def get_my_teacher_assignment(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not (
        has_permission(current_user, "student_attendance", "view")
        or has_permission(current_user, "teachers", "view")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view class assignments",
        )
    org_id = require_organization_id(current_user)
    teacher = (
        db.query(models.Teacher)
        .filter(models.Teacher.user_id == current_user.id, models.Teacher.organization_id == org_id)
        .first()
    )
    assignment = None
    if teacher:
        assignment = (
            _assignment_query(db, org_id)
            .filter(models.TeacherClassAssignment.teacher_id == teacher.id)
            .first()
        )
    if current_user.role == "teacher":
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are not assigned to a class. Ask an admin to assign a class first.",
            )
        return _assignment_response(assignment)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No class assignment found")
    return _assignment_response(assignment)


@router.get(
    "/api/teacher-assignments",
    response_model=List[schemas.TeacherClassAssignmentResponse],
)
def list_teacher_assignments(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teachers", "view")),
):
    assignments = _assignment_query(db, org_id).order_by(
        models.TeacherClassAssignment.created_at.desc()
    ).all()
    return [_assignment_response(assignment) for assignment in assignments]


@router.post(
    "/api/teacher-assignments",
    response_model=schemas.TeacherClassAssignmentResponse,
)
def save_teacher_assignment(
    payload: schemas.TeacherClassAssignmentCreate,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teachers", "update")),
):
    teacher = _get_org_teacher(db, payload.teacher_id, org_id)
    school_class, section = _validate_class_section(db, payload.class_id, payload.section_id, org_id)
    now = datetime.utcnow()

    assignment = (
        db.query(models.TeacherClassAssignment)
        .filter(
            models.TeacherClassAssignment.teacher_id == teacher.id,
            models.TeacherClassAssignment.organization_id == org_id,
        )
        .first()
    )

    if assignment:
        assignment.class_id = school_class.id
        assignment.section_id = section.id
        assignment.updated_at = now
    else:
        assignment = models.TeacherClassAssignment(
            teacher_id=teacher.id,
            class_id=school_class.id,
            section_id=section.id,
            organization_id=org_id,
            created_at=now,
            updated_at=now,
        )
        db.add(assignment)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not save assignment. This teacher may already be assigned.",
        )

    saved = (
        _assignment_query(db, org_id)
        .filter(models.TeacherClassAssignment.id == assignment.id)
        .first()
    )
    if not saved:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Assignment was saved but could not be loaded",
        )
    return _assignment_response(saved)


def _get_org_assignment(db: Session, assignment_id: int, org_id: int) -> models.TeacherClassAssignment:
    assignment = _assignment_query(db, org_id).filter(
        models.TeacherClassAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


@router.delete("/api/teacher-assignments/{assignment_id}")
def delete_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("teachers", "delete")),
):
    assignment = _get_org_assignment(db, assignment_id, org_id)
    assignment.mark_deleted()
    db.commit()
    return {"message": "Assignment deleted successfully", "assignment_id": assignment_id}
