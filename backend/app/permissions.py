from typing import Sequence

from fastapi import Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import auth, models

PERMISSION_CATALOG: list[dict] = [
    {"key": "dashboard", "label": "Dashboard", "actions": ["view"]},
    {"key": "organization", "label": "Organization", "actions": ["view", "create", "update", "delete"]},
    {"key": "students", "label": "Students", "actions": ["view", "create", "update", "delete"]},
    {"key": "teachers", "label": "Teachers", "actions": ["view", "create", "update", "delete"]},
    {"key": "classes", "label": "Classes", "actions": ["view", "create", "update", "delete"]},
    {"key": "sections", "label": "Sections", "actions": ["view", "create", "update", "delete"]},
    {"key": "subjects", "label": "Subjects", "actions": ["view", "create", "update", "delete"]},
    {"key": "student_attendance", "label": "Student Attendance", "actions": ["view", "take", "update", "delete"]},
    {"key": "teacher_attendance", "label": "Teacher Attendance", "actions": ["view", "take", "update", "delete"]},
    {"key": "my_attendance", "label": "My Attendance", "actions": ["view"]},
    {"key": "my_requests", "label": "My Request", "actions": ["view", "create", "update"]},
    {"key": "requests", "label": "Requests", "actions": ["view", "update", "delete"]},
    {"key": "settings", "label": "Settings", "actions": ["view", "update"]},
    {"key": "permissions", "label": "Permissions", "actions": ["view", "update"]},
]

ROLE_LABELS = {
    "superadmin": "Super Admin",
    "admin": "Admin",
    "teacher": "Teacher",
    "student": "Student",
    "parent": "Parent",
}

DEFAULT_ROLE_PERMISSIONS: dict[str, dict[str, list[str]]] = {
    "superadmin": {
        "dashboard": ["view"],
        "organization": ["view", "create", "update", "delete"],
        "permissions": ["view", "update"],
        "settings": ["view", "update"],
    },
    "admin": {
        "dashboard": ["view"],
        "organization": ["view", "update"],
        "students": ["view", "create", "update", "delete"],
        "teachers": ["view", "create", "update", "delete"],
        "classes": ["view", "create", "update", "delete"],
        "sections": ["view", "create", "update", "delete"],
        "subjects": ["view", "create", "update", "delete"],
        "student_attendance": ["view", "take", "update", "delete"],
        "teacher_attendance": ["view", "take", "update", "delete"],
        "requests": ["view", "update", "delete"],
        "settings": ["view", "update"],
    },
    "teacher": {
        "dashboard": ["view"],
        "student_attendance": ["view", "take"],
        "my_attendance": ["view"],
        "my_requests": ["view", "create", "update"],
        "requests": ["view", "update"],
        "settings": ["view", "update"],
    },
    "student": {
        "dashboard": ["view"],
        "my_attendance": ["view"],
        "my_requests": ["view", "create", "update"],
        "settings": ["view", "update"],
    },
    "parent": {
        "dashboard": ["view"],
        "settings": ["view", "update"],
    },
}


def permission_key(module: str, action: str) -> str:
    return f"{module}.{action}"


def catalog_keys() -> set[str]:
    return {
        permission_key(module["key"], action)
        for module in PERMISSION_CATALOG
        for action in module["actions"]
    }


def role_label(name: str) -> str:
    return ROLE_LABELS.get(name, name.replace("_", " ").title())


def has_permission(user: models.User, module: str, action: str) -> bool:
    return permission_key(module, action) in set(user.permissions or [])


def require_organization_id(current_user: models.User) -> int:
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization",
        )
    return current_user.organization_id


def _missing_permission_error(module: str, action: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"You do not have permission to {action} {module}",
    )


def require_permission(module: str, action: str):
    def _checker(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
        if not has_permission(current_user, module, action):
            raise _missing_permission_error(module, action)
        return current_user

    return _checker


def require_any_permission(*pairs: tuple[str, str]):
    def _checker(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
        if not any(has_permission(current_user, module, action) for module, action in pairs):
            first_module, first_action = pairs[0]
            raise _missing_permission_error(first_module, first_action)
        return current_user

    return _checker


def require_org_permission(module: str, action: str):
    def _checker(current_user: models.User = Depends(auth.get_current_user)) -> int:
        if not has_permission(current_user, module, action):
            raise _missing_permission_error(module, action)
        return require_organization_id(current_user)

    return _checker


def require_org_any_permission(*pairs: tuple[str, str]):
    def _checker(current_user: models.User = Depends(auth.get_current_user)) -> int:
        if not any(has_permission(current_user, module, action) for module, action in pairs):
            first_module, first_action = pairs[0]
            raise _missing_permission_error(first_module, first_action)
        return require_organization_id(current_user)

    return _checker


def require_platform_permission(module: str, action: str):
    def _checker(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
        if not has_permission(current_user, module, action):
            raise _missing_permission_error(module, action)
        if current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This action is only available to platform administrators",
            )
        return current_user

    return _checker


def seed_permissions(db: Session) -> None:
    for module in PERMISSION_CATALOG:
        for action in module["actions"]:
            exists = (
                db.query(models.Permission)
                .filter(
                    models.Permission.module == module["key"],
                    models.Permission.action == action,
                )
                .first()
            )
            if not exists:
                db.add(models.Permission(module=module["key"], action=action))
    db.flush()
    prune_obsolete_permissions(db)
    db.commit()
    grant_missing_default_permissions(db)
    db.commit()


def prune_obsolete_permissions(db: Session) -> None:
    valid_keys = catalog_keys()
    obsolete_ids = [
        permission.id
        for permission in db.query(models.Permission).all()
        if permission_key(permission.module, permission.action) not in valid_keys
    ]
    if not obsolete_ids:
        return

    db.query(models.RolePermission).filter(
        models.RolePermission.permission_id.in_(obsolete_ids)
    ).delete(synchronize_session=False)
    db.query(models.OrganizationRolePermission).filter(
        models.OrganizationRolePermission.permission_id.in_(obsolete_ids)
    ).delete(synchronize_session=False)
    db.query(models.Permission).filter(models.Permission.id.in_(obsolete_ids)).delete(
        synchronize_session=False
    )


def grant_missing_default_permissions(db: Session) -> None:
    permissions_by_key = _permissions_by_key(db)

    for role_name, modules in DEFAULT_ROLE_PERMISSIONS.items():
        role = db.query(models.Role).filter(models.Role.name == role_name).first()
        if not role:
            role = models.Role(name=role_name)
            db.add(role)
            db.flush()

        existing_keys = {
            permission_key(permission.module, permission.action)
            for permission in (
                db.query(models.Permission)
                .join(
                    models.RolePermission,
                    models.RolePermission.permission_id == models.Permission.id,
                )
                .filter(models.RolePermission.role_id == role.id)
                .all()
            )
        }

        for module_key, actions in modules.items():
            for action in actions:
                key = permission_key(module_key, action)
                if key in existing_keys:
                    continue
                permission = permissions_by_key.get(key)
                if permission:
                    db.add(
                        models.RolePermission(role_id=role.id, permission_id=permission.id)
                    )

    grant_missing_organization_action_permissions(db)


def grant_missing_organization_action_permissions(db: Session) -> None:
    permissions_by_key = _permissions_by_key(db)
    organizations = db.query(models.Organization.id).all()
    tenant_roles = (
        db.query(models.Role).filter(models.Role.name.in_(TENANT_ROLE_NAMES)).all()
    )

    for (organization_id,) in organizations:
        if not organization_has_role_permissions(db, organization_id):
            continue

        for role in tenant_roles:
            defaults = DEFAULT_ROLE_PERMISSIONS.get(role.name, {})
            existing_keys = {
                permission_key(permission.module, permission.action)
                for permission in (
                    db.query(models.Permission)
                    .join(
                        models.OrganizationRolePermission,
                        models.OrganizationRolePermission.permission_id == models.Permission.id,
                    )
                    .filter(
                        models.OrganizationRolePermission.organization_id == organization_id,
                        models.OrganizationRolePermission.role_id == role.id,
                    )
                    .all()
                )
            }
            for module_key, actions in defaults.items():
                for action in actions:
                    key = permission_key(module_key, action)
                    if key in existing_keys:
                        continue
                    permission = permissions_by_key.get(key)
                    if permission:
                        db.add(
                            models.OrganizationRolePermission(
                                organization_id=organization_id,
                                role_id=role.id,
                                permission_id=permission.id,
                            )
                        )


TENANT_ROLE_NAMES = ("admin", "teacher", "student", "parent")


def _permissions_by_key(db: Session) -> dict[str, models.Permission]:
    return {
        permission_key(permission.module, permission.action): permission
        for permission in db.query(models.Permission).all()
    }


def organization_has_role_permissions(db: Session, organization_id: int) -> bool:
    return (
        db.query(models.OrganizationRolePermission.id)
        .filter(models.OrganizationRolePermission.organization_id == organization_id)
        .first()
        is not None
    )


def copy_default_role_permissions_to_organization(db: Session, organization_id: int) -> None:
    default_rows = (
        db.query(models.RolePermission.role_id, models.RolePermission.permission_id)
        .join(models.Role, models.Role.id == models.RolePermission.role_id)
        .filter(models.Role.name.in_(TENANT_ROLE_NAMES))
        .all()
    )
    for role_id, permission_id in default_rows:
        db.add(
            models.OrganizationRolePermission(
                organization_id=organization_id,
                role_id=role_id,
                permission_id=permission_id,
            )
        )
    db.flush()


def ensure_organization_role_permissions(db: Session, organization_id: int) -> None:
    if organization_has_role_permissions(db, organization_id):
        return
    try:
        copy_default_role_permissions_to_organization(db, organization_id)
        db.commit()
    except IntegrityError:
        db.rollback()


def org_role_permission_keys(db: Session, organization_id: int, role_id: int) -> list[str]:
    rows = (
        db.query(models.Permission.module, models.Permission.action)
        .join(
            models.OrganizationRolePermission,
            models.OrganizationRolePermission.permission_id == models.Permission.id,
        )
        .filter(
            models.OrganizationRolePermission.organization_id == organization_id,
            models.OrganizationRolePermission.role_id == role_id,
        )
        .all()
    )
    valid_keys = catalog_keys()
    return sorted(
        key
        for module, action in rows
        if (key := permission_key(module, action)) in valid_keys
    )


def replace_organization_role_permissions(
    db: Session,
    organization_id: int,
    role_id: int,
    permission_ids: Sequence[int],
) -> None:
    db.query(models.OrganizationRolePermission).filter(
        models.OrganizationRolePermission.organization_id == organization_id,
        models.OrganizationRolePermission.role_id == role_id,
    ).delete(synchronize_session=False)
    for permission_id in permission_ids:
        db.add(
            models.OrganizationRolePermission(
                organization_id=organization_id,
                role_id=role_id,
                permission_id=permission_id,
            )
        )


def restore_default_tenant_role_permissions(db: Session) -> None:
    permissions_by_key = _permissions_by_key(db)
    roles = db.query(models.Role).filter(models.Role.name.in_(TENANT_ROLE_NAMES)).all()
    for role in roles:
        db.query(models.RolePermission).filter(models.RolePermission.role_id == role.id).delete()
        for module_key, actions in DEFAULT_ROLE_PERMISSIONS.get(role.name, {}).items():
            for action in actions:
                permission = permissions_by_key.get(permission_key(module_key, action))
                if permission:
                    db.add(models.RolePermission(role_id=role.id, permission_id=permission.id))
    db.commit()


def backfill_organization_role_permissions(db: Session) -> None:
    organizations = db.query(models.Organization.id).all()
    had_any_copies = db.query(models.OrganizationRolePermission.id).first() is not None
    for (organization_id,) in organizations:
        if not organization_has_role_permissions(db, organization_id):
            copy_default_role_permissions_to_organization(db, organization_id)
    db.commit()
    if organizations and not had_any_copies:
        restore_default_tenant_role_permissions(db)


def permission_ids_for_keys(db: Session, keys: Sequence[str]) -> list[int]:
    valid_keys = catalog_keys()
    known_keys = [key for key in keys if key in valid_keys]

    if not known_keys:
        return []

    modules_and_actions = [key.split(".", 1) for key in known_keys]
    permissions = (
        db.query(models.Permission)
        .filter(
            models.Permission.module.in_({item[0] for item in modules_and_actions}),
        )
        .all()
    )
    by_key = {permission_key(item.module, item.action): item for item in permissions}
    missing = [key for key in known_keys if key not in by_key]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permission(s) not found: {', '.join(missing)}",
        )
    return [by_key[key].id for key in known_keys]


def role_permission_keys(role: models.Role) -> list[str]:
    valid_keys = catalog_keys()
    return sorted(
        key
        for permission in (role.permissions or [])
        if (key := permission_key(permission.module, permission.action)) in valid_keys
    )
