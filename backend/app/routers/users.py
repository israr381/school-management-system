import asyncio

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db
from app.permissions import require_permission
from app.services.cloudinary_service import (
    assert_user_avatar_public_id,
    assert_user_staging_public_id,
    delete_user_avatar,
    upload_user_avatar_staging,
    validate_logo_file,
)

router = APIRouter(prefix="/api/users", tags=["users"])
avatar_router = APIRouter(tags=["users"])


@router.put("/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("permissions", "update")),
):

    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if (
        current_user.organization_id is not None
        and user_to_update.organization_id != current_user.organization_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users outside your organization",
        )

    target_role = db.query(models.Role).filter(models.Role.name == role_data.role).first()
    if not target_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{role_data.role}' does not exist",
        )

    user_to_update.role_id = target_role.id
    db.commit()
    db.refresh(user_to_update)
    return user_to_update


@avatar_router.post("/api/user/avatar/staging", response_model=schemas.AvatarStagingResponse)
async def upload_user_avatar_staging_endpoint(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    file_bytes = await file.read()
    validate_logo_file(file.content_type, len(file_bytes))

    avatar_url, avatar_public_id = await asyncio.to_thread(
        upload_user_avatar_staging,
        file_bytes,
        current_user.id,
    )
    return schemas.AvatarStagingResponse(
        avatar_url=avatar_url,
        avatar_public_id=avatar_public_id,
    )


@avatar_router.put("/api/user/avatar", response_model=schemas.UserResponse)
async def commit_user_avatar(
    avatar_data: schemas.UserAvatarCommit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if avatar_data.avatar_url and avatar_data.avatar_public_id:
        assert_user_avatar_public_id(user.id, avatar_data.avatar_public_id)

        if user.avatar_public_id and user.avatar_public_id != avatar_data.avatar_public_id:
            await asyncio.to_thread(delete_user_avatar, user.avatar_public_id)

        user.avatar_url = avatar_data.avatar_url
        user.avatar_public_id = avatar_data.avatar_public_id
    else:
        if user.avatar_public_id:
            await asyncio.to_thread(delete_user_avatar, user.avatar_public_id)
        user.avatar_url = None
        user.avatar_public_id = None

    db.commit()
    db.refresh(user)
    return user


@avatar_router.delete("/api/user/avatar/staging", status_code=status.HTTP_204_NO_CONTENT)
async def discard_user_avatar_staging(
    public_id: str = Query(..., min_length=1),
    current_user: models.User = Depends(auth.get_current_user),
):
    assert_user_staging_public_id(current_user.id, public_id)
    await asyncio.to_thread(delete_user_avatar, public_id)
    return None
