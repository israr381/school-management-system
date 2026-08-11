from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db

router = APIRouter(tags=["organizations"])


@router.get("/api/superadmin/tenants", response_model=schemas.SuperAdminTenantsResponse)
def get_superadmin_tenants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can view tenant statistics",
        )

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
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can create new organizations",
        )

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

    admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if not admin_role:
        admin_role = models.Role(name="admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    hashed_pwd = auth.hash_password(data.admin_password)
    new_admin = models.User(
        email=data.admin_email.strip(),
        password_hash=hashed_pwd,
        full_name=data.admin_full_name.strip(),
        role_id=admin_role.id,
        organization_id=new_org.id,
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
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can update organizations",
        )

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


@router.delete("/api/superadmin/organizations/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can delete organizations",
        )

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
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != "admin" and current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update organization details",
        )

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
