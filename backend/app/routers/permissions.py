from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.permissions import (
    PERMISSION_CATALOG,
    ROLE_LABELS,
    ensure_organization_role_permissions,
    org_role_permission_keys,
    permission_ids_for_keys,
    replace_organization_role_permissions,
    require_permission,
    role_label,
    role_permission_keys,
)

router = APIRouter(tags=["permissions"])


def _role_response(role: models.Role, permission_keys: list[str] | None = None) -> schemas.RoleResponse:
    return schemas.RoleResponse(
        id=role.id,
        name=role.name,
        label=role_label(role.name),
        permissions=permission_keys if permission_keys is not None else role_permission_keys(role),
    )


@router.get("/api/permissions/catalog", response_model=list[schemas.PermissionModuleCatalog])
def get_permission_catalog(
    current_user: models.User = Depends(require_permission("permissions", "view")),
):
    return [
        schemas.PermissionModuleCatalog(
            key=module["key"],
            label=module["label"],
            actions=list(module["actions"]),
        )
        for module in PERMISSION_CATALOG
    ]


@router.get("/api/roles", response_model=list[schemas.RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("permissions", "view")),
):
    roles = (
        db.query(models.Role)
        .options(joinedload(models.Role.permissions))
        .order_by(models.Role.id.asc())
        .all()
    )
    ordered_names = list(ROLE_LABELS.keys())
    if current_user.organization_id:
        ensure_organization_role_permissions(db, current_user.organization_id)
        roles = [role for role in roles if role.name != "superadmin"]
    roles.sort(
        key=lambda role: ordered_names.index(role.name)
        if role.name in ordered_names
        else len(ordered_names)
    )
    if current_user.organization_id:
        return [
            _role_response(
                role,
                org_role_permission_keys(db, current_user.organization_id, role.id),
            )
            for role in roles
        ]
    return [_role_response(role) for role in roles]


@router.put("/api/roles/{role_id}/permissions", response_model=schemas.RoleResponse)
def update_role_permissions(
    role_id: int,
    payload: schemas.RolePermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("permissions", "update")),
):
    role = (
        db.query(models.Role)
        .options(joinedload(models.Role.permissions))
        .filter(models.Role.id == role_id)
        .first()
    )
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if current_user.organization_id and role.name == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admins cannot change Super Admin permissions",
        )

    unique_keys = sorted(set(payload.permissions))
    if current_user.organization_id:
        ensure_organization_role_permissions(db, current_user.organization_id)
        current_keys = set(org_role_permission_keys(db, current_user.organization_id, role.id))
    else:
        current_keys = set(role_permission_keys(role))
    manage_key = "permissions.update"

    if role.name == "superadmin" and manage_key not in unique_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super Admin must keep the permission to manage permissions",
        )

    if current_user.role_id == role.id and manage_key in current_keys and manage_key not in unique_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own permission to manage permissions",
        )

    permission_ids = permission_ids_for_keys(db, unique_keys)
    if current_user.organization_id:
        replace_organization_role_permissions(
            db,
            current_user.organization_id,
            role.id,
            permission_ids,
        )
    else:
        db.query(models.RolePermission).filter(models.RolePermission.role_id == role.id).delete()
        for permission_id in permission_ids:
            db.add(models.RolePermission(role_id=role.id, permission_id=permission_id))
    db.commit()

    role = (
        db.query(models.Role)
        .options(joinedload(models.Role.permissions))
        .filter(models.Role.id == role.id)
        .first()
    )
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if current_user.organization_id:
        return _role_response(
            role,
            org_role_permission_keys(db, current_user.organization_id, role.id),
        )
    return _role_response(role)
