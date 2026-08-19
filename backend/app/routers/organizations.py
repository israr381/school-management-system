import asyncio

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db
from app.permissions import ensure_organization_role_permissions, require_permission, require_platform_permission
from app.services.cloudinary_service import (
    assert_org_logo_public_id,
    assert_staging_public_id,
    delete_organization_logo,
    upload_organization_logo_staging,
    validate_logo_file,
)

router = APIRouter(tags=["organizations"])


@router.get("/api/superadmin/tenants", response_model=schemas.SuperAdminTenantsResponse)
def get_superadmin_tenants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_platform_permission("organization", "view")),
):

    orgs = db.query(models.Organization).all()
    tenants = []
    for org in orgs:
        u_count = (
            db.query(models.User).filter(models.User.organization_id == org.id).count()
        )
        tenants.append(
            schemas.TenantResponse(
                id=org.id,
                name=org.name,
                domain=org.domain,
                logo_url=org.logo_url,
                is_active=org.is_active,
                created_at=org.created_at,
                user_count=u_count,
            )
        )

    total_tenants = len(orgs)
    total_users = db.query(models.User).count()

    return schemas.SuperAdminTenantsResponse(
        total_tenants=total_tenants,
        total_users=total_users,
        tenants=tenants,
    )


@router.post("/api/superadmin/organizations", status_code=status.HTTP_201_CREATED)
def create_organization(
    data: schemas.CreateOrganizationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_platform_permission("organization", "create")),
):

    existing_org = (
        db.query(models.Organization)
        .filter(models.Organization.domain == data.organization_domain.strip().lower())
        .first()
    )
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization domain is already registered",
        )

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == data.admin_email.strip())
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin email is already registered",
        )

    new_org = models.Organization(
        name=data.organization_name.strip(),
        domain=data.organization_domain.strip().lower(),
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    ensure_organization_role_permissions(db, new_org.id)

    admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if not admin_role:
        admin_role = models.Role(name="admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    hashed_pwd = auth.hash_password(auth.DEFAULT_ADMIN_PASSWORD)
    new_admin = models.User(
        email=data.admin_email.strip(),
        password_hash=hashed_pwd,
        full_name=data.admin_full_name.strip(),
        role_id=admin_role.id,
        organization_id=new_org.id,
        must_change_password=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "Organization and admin user created successfully",
        "organization_id": new_org.id,
        "organization_name": new_org.name,
        "organization_domain": new_org.domain,
        "admin_email": new_admin.email,
    }


@router.put(
    "/api/superadmin/organizations/{org_id}",
    response_model=schemas.OrganizationResponse,
)
def update_organization_by_id(
    org_id: int,
    org_data: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_platform_permission("organization", "update")),
):

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    new_domain = org_data.domain.strip().lower()
    if new_domain != org.domain:
        domain_exists = (
            db.query(models.Organization)
            .filter(
                models.Organization.domain == new_domain,
                models.Organization.id != org_id,
            )
            .first()
        )
        if domain_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization domain is already registered by another organization",
            )
        org.domain = new_domain

    org.name = org_data.name.strip()
    db.commit()
    db.refresh(org)
    return org


@router.patch(
    "/api/superadmin/organizations/{org_id}/status",
    response_model=schemas.TenantResponse,
)
def update_organization_status(
    org_id: int,
    status_data: schemas.OrganizationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_platform_permission("organization", "update")),
):

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    org.is_active = status_data.is_active
    db.commit()
    db.refresh(org)

    user_count = (
        db.query(models.User).filter(models.User.organization_id == org.id).count()
    )
    return schemas.TenantResponse(
        id=org.id,
        name=org.name,
        domain=org.domain,
        logo_url=org.logo_url,
        is_active=org.is_active,
        created_at=org.created_at,
        user_count=user_count,
    )


@router.delete("/api/superadmin/organizations/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_platform_permission("organization", "delete")),
):

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    db.delete(org)
    db.commit()
    return {"message": "Organization deleted successfully", "organization_id": org_id}


@router.put("/api/organization", response_model=schemas.OrganizationResponse)
def update_organization(
    org_data: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("organization", "update")),
):

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization",
        )

    org = (
        db.query(models.Organization)
        .filter(models.Organization.id == current_user.organization_id)
        .first()
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    new_domain = org_data.domain.strip().lower()
    if new_domain != org.domain:
        domain_exists = (
            db.query(models.Organization)
            .filter(models.Organization.domain == new_domain)
            .first()
        )
        if domain_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization domain is already registered by another organization",
            )
        org.domain = new_domain

    org.name = org_data.name.strip()
    db.commit()
    db.refresh(org)
    return org


def _get_admin_organization(
    db: Session, current_user: models.User
) -> models.Organization:

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any organization",
        )

    org = (
        db.query(models.Organization)
        .filter(models.Organization.id == current_user.organization_id)
        .first()
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return org


@router.post("/api/organization/logo/staging", response_model=schemas.LogoStagingResponse)
async def upload_organization_logo_staging_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("organization", "update")),
):
    org = _get_admin_organization(db, current_user)

    file_bytes = await file.read()
    validate_logo_file(file.content_type, len(file_bytes))

    logo_url, logo_public_id = await asyncio.to_thread(
        upload_organization_logo_staging,
        file_bytes,
        org.id,
    )
    return schemas.LogoStagingResponse(
        logo_url=logo_url,
        logo_public_id=logo_public_id,
    )


@router.put("/api/organization/logo", response_model=schemas.OrganizationResponse)
async def commit_organization_logo(
    logo_data: schemas.OrganizationLogoCommit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("organization", "update")),
):
    org = _get_admin_organization(db, current_user)

    if logo_data.logo_url and logo_data.logo_public_id:
        assert_org_logo_public_id(org.id, logo_data.logo_public_id)

        if org.logo_public_id and org.logo_public_id != logo_data.logo_public_id:
            await asyncio.to_thread(delete_organization_logo, org.logo_public_id)

        org.logo_url = logo_data.logo_url
        org.logo_public_id = logo_data.logo_public_id
    else:
        if org.logo_public_id:
            await asyncio.to_thread(delete_organization_logo, org.logo_public_id)
        org.logo_url = None
        org.logo_public_id = None

    db.commit()
    db.refresh(org)
    return org


@router.delete("/api/organization/logo/staging", status_code=status.HTTP_204_NO_CONTENT)
async def discard_organization_logo_staging(
    public_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("organization", "update")),
):
    org = _get_admin_organization(db, current_user)
    assert_staging_public_id(org.id, public_id)
    await asyncio.to_thread(delete_organization_logo, public_id)
    return None
