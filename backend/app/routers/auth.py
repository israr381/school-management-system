from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import auth, models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.Token)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    org_name = (
        user_data.organization_name.strip()
        if user_data.organization_name and user_data.organization_name.strip()
        else None
    )
    org_domain = (
        user_data.organization_domain.strip().lower()
        if user_data.organization_domain and user_data.organization_domain.strip()
        else None
    )

    if (org_name and not org_domain) or (org_domain and not org_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both organization name and organization domain must be provided together, or both left empty.",
        )

    org_id = None
    role_name = "superadmin"

    if org_name and org_domain:
        org = db.query(models.Organization).filter(models.Organization.domain == org_domain).first()
        if not org:
            org = models.Organization(name=org_name, domain=org_domain)
            db.add(org)
            db.commit()
            db.refresh(org)
        org_id = org.id
        role_name = "admin"

    role = db.query(models.Role).filter(models.Role.name == role_name).first()
    if not role:
        role = models.Role(name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)

    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(
        email=user_data.email,
        password_hash=hashed_pwd,
        full_name=user_data.full_name.strip(),
        role_id=role.id,
        organization_id=org_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "remember_me": False}


@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if user.organization_id and user.organization and not user.organization.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This organization has been disabled. Please contact support.",
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    refresh_token = None
    if login_data.remember_me:
        refresh_token = auth.create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "remember_me": login_data.remember_me,
    }


@router.post("/refresh", response_model=schemas.Token)
def refresh_access_token(payload: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_data = auth.decode_token(payload.refresh_token, expected_type="refresh")
        email = token_data.get("sub")
    except Exception:
        raise credentials_exception

    if not email:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise credentials_exception

    if user.organization_id and user.organization and not user.organization.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This organization has been disabled. Please contact support.",
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "remember_me": True,
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
