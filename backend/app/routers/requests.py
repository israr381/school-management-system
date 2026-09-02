from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import auth, models, schemas
from app.database import get_db
from app.permissions import has_permission, require_org_permission, require_organization_id

router = APIRouter(tags=["requests"])

VALID_REQUESTER_ROLES = {"student", "teacher"}


def _leave_days(from_date: date, to_date: date) -> int:
    return (to_date - from_date).days + 1


def _validate_leave_dates(from_date: date, to_date: date) -> None:
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The end date cannot be before the start date",
        )


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


def _get_requester_context(
    db: Session, user: models.User, org_id: int
) -> tuple[str, Optional[models.Student], Optional[models.Teacher]]:
    if user.role == "student":
        student = (
            db.query(models.Student)
            .options(joinedload(models.Student.school_class), joinedload(models.Student.section))
            .filter(models.Student.user_id == user.id, models.Student.organization_id == org_id)
            .first()
        )
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found for this account",
            )
        return "student", student, None

    if user.role == "teacher":
        teacher = (
            db.query(models.Teacher)
            .filter(models.Teacher.user_id == user.id, models.Teacher.organization_id == org_id)
            .first()
        )
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found for this account",
            )
        return "teacher", None, teacher

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only students and teachers can submit leave requests",
    )


def _has_overlapping_leave(
    db: Session,
    org_id: int,
    requester_user_id: int,
    from_date: date,
    to_date: date,
    exclude_id: Optional[int] = None,
) -> bool:
    query = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.organization_id == org_id,
        models.LeaveRequest.requester_user_id == requester_user_id,
        models.LeaveRequest.status.in_(("pending", "approved")),
        models.LeaveRequest.from_date <= to_date,
        models.LeaveRequest.to_date >= from_date,
    )
    if exclude_id is not None:
        query = query.filter(models.LeaveRequest.id != exclude_id)
    return query.first() is not None


def _request_query(db: Session, org_id: int):
    return (
        db.query(models.LeaveRequest)
        .options(
            joinedload(models.LeaveRequest.requester),
            joinedload(models.LeaveRequest.reviewer),
            joinedload(models.LeaveRequest.school_class),
            joinedload(models.LeaveRequest.section),
        )
        .filter(models.LeaveRequest.organization_id == org_id)
    )


def _to_response(
    row: models.LeaveRequest,
    current_user: models.User,
) -> schemas.LeaveRequestResponse:
    can_cancel = (
        row.status == "pending"
        and row.requester_user_id == current_user.id
        and has_permission(current_user, "my_requests", "update")
    )
    can_review = row.status == "pending" and has_permission(current_user, "requests", "update")
    if current_user.role == "teacher" and row.requester_role != "student":
        can_review = False
    if row.requester_user_id == current_user.id:
        can_review = False
    can_delete = has_permission(current_user, "requests", "delete")

    return schemas.LeaveRequestResponse(
        id=row.id,
        request_type="leave",
        requester_role=row.requester_role,
        requester_name=row.requester.full_name if row.requester else "",
        requester_email=row.requester.email if row.requester else None,
        class_id=row.class_id,
        class_name=row.school_class.name if row.school_class else None,
        section_id=row.section_id,
        section_name=row.section.name if row.section else None,
        from_date=row.from_date,
        to_date=row.to_date,
        days=_leave_days(row.from_date, row.to_date),
        reason=row.reason,
        status=row.status,
        review_note=row.review_note,
        reviewer_name=row.reviewer.full_name if row.reviewer else None,
        reviewed_at=row.reviewed_at,
        created_at=row.created_at,
        can_cancel=can_cancel,
        can_review=can_review,
        can_delete=can_delete,
    )


@router.get("/api/my-requests", response_model=List[schemas.LeaveRequestResponse])
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "my_requests", "view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view your requests",
        )
    org_id = require_organization_id(current_user)
    rows = (
        _request_query(db, org_id)
        .filter(models.LeaveRequest.requester_user_id == current_user.id)
        .order_by(models.LeaveRequest.created_at.desc())
        .all()
    )
    return [_to_response(row, current_user) for row in rows]


@router.post("/api/my-requests", response_model=schemas.LeaveRequestResponse)
def create_my_request(
    payload: schemas.LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "my_requests", "create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create a request",
        )
    org_id = require_organization_id(current_user)
    _validate_leave_dates(payload.from_date, payload.to_date)
    requester_role, student, teacher = _get_requester_context(db, current_user, org_id)

    if _has_overlapping_leave(db, org_id, current_user.id, payload.from_date, payload.to_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending or approved leave request in this date range",
        )

    now = datetime.utcnow()
    row = models.LeaveRequest(
        organization_id=org_id,
        requester_user_id=current_user.id,
        requester_role=requester_role,
        student_id=student.id if student else None,
        teacher_id=teacher.id if teacher else None,
        class_id=student.class_id if student else None,
        section_id=student.section_id if student else None,
        request_type="leave",
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason.strip(),
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    saved = _request_query(db, org_id).filter(models.LeaveRequest.id == row.id).first()
    if not saved:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Request was saved but could not be loaded",
        )
    return _to_response(saved, current_user)


@router.patch("/api/my-requests/{request_id}", response_model=schemas.LeaveRequestResponse)
def update_my_request(
    request_id: int,
    payload: schemas.LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "my_requests", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update your request",
        )
    org_id = require_organization_id(current_user)
    row = (
        _request_query(db, org_id)
        .filter(
            models.LeaveRequest.id == request_id,
            models.LeaveRequest.requester_user_id == current_user.id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if row.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be updated",
        )

    from_date = payload.from_date or row.from_date
    to_date = payload.to_date or row.to_date
    _validate_leave_dates(from_date, to_date)
    if _has_overlapping_leave(db, org_id, current_user.id, from_date, to_date, exclude_id=row.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending or approved leave request in this date range",
        )

    row.from_date = from_date
    row.to_date = to_date
    if payload.reason is not None:
        row.reason = payload.reason.strip()
    row.updated_at = datetime.utcnow()
    db.commit()
    saved = _request_query(db, org_id).filter(models.LeaveRequest.id == row.id).first()
    return _to_response(saved, current_user)


@router.post("/api/my-requests/{request_id}/cancel", response_model=schemas.LeaveRequestResponse)
def cancel_my_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not has_permission(current_user, "my_requests", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to cancel your request",
        )
    org_id = require_organization_id(current_user)
    row = (
        _request_query(db, org_id)
        .filter(
            models.LeaveRequest.id == request_id,
            models.LeaveRequest.requester_user_id == current_user.id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if row.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be cancelled",
        )
    row.status = "cancelled"
    row.updated_at = datetime.utcnow()
    db.commit()
    saved = _request_query(db, org_id).filter(models.LeaveRequest.id == row.id).first()
    return _to_response(saved, current_user)


@router.get("/api/requests/pending-count", response_model=schemas.PendingRequestCounts)
def pending_request_counts(
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("requests", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(
        models.LeaveRequest.requester_role,
        func.count(models.LeaveRequest.id),
    ).filter(
        models.LeaveRequest.organization_id == org_id,
        models.LeaveRequest.status == "pending",
    )

    if current_user.role == "teacher":
        assignment = _get_teacher_assignment(db, current_user, org_id)
        if not assignment:
            return schemas.PendingRequestCounts(total=0, student=0, teacher=0)
        query = query.filter(
            models.LeaveRequest.requester_role == "student",
            models.LeaveRequest.class_id == assignment.class_id,
            models.LeaveRequest.section_id == assignment.section_id,
        )

    student = 0
    teacher = 0
    for role, count in query.group_by(models.LeaveRequest.requester_role).all():
        if role == "student":
            student = int(count or 0)
        elif role == "teacher":
            teacher = int(count or 0)
    return schemas.PendingRequestCounts(total=student + teacher, student=student, teacher=teacher)


@router.get("/api/requests", response_model=List[schemas.LeaveRequestResponse])
def list_requests(
    requester_role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("requests", "view")),
    current_user: models.User = Depends(auth.get_current_user),
):
    if requester_role and requester_role not in VALID_REQUESTER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid requester role",
        )

    query = _request_query(db, org_id)

    if current_user.role == "teacher":
        assignment = _get_teacher_assignment(db, current_user, org_id)
        if not assignment:
            return []
        query = query.filter(
            models.LeaveRequest.requester_role == "student",
            models.LeaveRequest.class_id == assignment.class_id,
            models.LeaveRequest.section_id == assignment.section_id,
        )
    elif requester_role:
        query = query.filter(models.LeaveRequest.requester_role == requester_role)

    rows = query.order_by(models.LeaveRequest.created_at.desc()).all()
    return [_to_response(row, current_user) for row in rows]


@router.post("/api/requests/{request_id}/review", response_model=schemas.LeaveRequestResponse)
def review_request(
    request_id: int,
    payload: schemas.LeaveRequestReview,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("requests", "update")),
    current_user: models.User = Depends(auth.get_current_user),
):
    row = _request_query(db, org_id).filter(models.LeaveRequest.id == request_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if row.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be reviewed",
        )
    if row.requester_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot review your own request",
        )

    if current_user.role == "teacher":
        if row.requester_role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teachers can only review student requests",
            )
        assignment = _get_teacher_assignment(db, current_user, org_id)
        if (
            not assignment
            or row.class_id != assignment.class_id
            or row.section_id != assignment.section_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This request is not from a student in your assigned class",
            )

    row.status = payload.status
    row.review_note = payload.review_note.strip() if payload.review_note else None
    row.reviewer_user_id = current_user.id
    row.reviewed_at = datetime.utcnow()
    row.updated_at = datetime.utcnow()
    db.commit()
    saved = _request_query(db, org_id).filter(models.LeaveRequest.id == row.id).first()
    return _to_response(saved, current_user)


@router.delete("/api/requests/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(require_org_permission("requests", "delete")),
):
    row = (
        db.query(models.LeaveRequest)
        .filter(models.LeaveRequest.id == request_id, models.LeaveRequest.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    row.mark_deleted()
    db.commit()
    return {"message": "Request deleted successfully"}
