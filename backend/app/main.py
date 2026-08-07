from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import check_db_connection, get_db, Base, engine, SessionLocal
from app import models, schemas, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        default_roles = ["superadmin", "admin"]
        for role_name in default_roles:
            exists = db.query(models.Role).filter(models.Role.name == role_name).first()
            if not exists:
                db.add(models.Role(name=role_name))
        db.commit()
        print("Default roles seeded successfully")
    except Exception as e:
        print(f"Error seeding roles: {e}")
        db.rollback()
    finally:
        db.close()

    if check_db_connection():
        print("Database run correctly and tables verified/created")
    else:
        print("Database connection FAILED")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home(db: Session = Depends(get_db)):
    db_status = "Not Connected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "Connected and running correctly"
    except Exception as e:
        db_status = f"Failed to connect: {str(e)}"

    return {
        "message": "School Management API Running",
        "database_status": db_status
    }

@app.post("/api/auth/signup", response_model=schemas.Token)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    org_name = user_data.organization_name.strip() if user_data.organization_name and user_data.organization_name.strip() else None
    org_domain = user_data.organization_domain.strip().lower() if user_data.organization_domain and user_data.organization_domain.strip() else None

    # Validate that if one is provided, both must be provided
    if (org_name and not org_domain) or (org_domain and not org_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both organization name and organization domain must be provided together, or both left empty."
        )

    org_id = None
    role_name = "superadmin"

    if org_name and org_domain:
        # Check if organization domain exists, otherwise create it
        org = db.query(models.Organization).filter(models.Organization.domain == org_domain).first()
        if not org:
            org = models.Organization(
                name=org_name,
                domain=org_domain
            )
            db.add(org)
            db.commit()
            db.refresh(org)
        org_id = org.id
        role_name = "admin"
        
    # Lookup role
    role = db.query(models.Role).filter(models.Role.name == role_name).first()
    if not role:
        role = models.Role(name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)

    # 4. Create user
    hashed_pwd = auth.hash_password(user_data.password)
    new_user = models.User(
        email=user_data.email,
        password_hash=hashed_pwd,
        full_name=user_data.full_name.strip(),
        role_id=role.id,
        organization_id=org_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 5. Generate token
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/api/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can modify user roles"
        )
        
    # Find user to update
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Ensure they belong to the same organization
    if current_user.organization_id is not None and user_to_update.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify users outside your organization"
        )
        
    # Find role in DB
    target_role = db.query(models.Role).filter(models.Role.name == role_data.role).first()
    if not target_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{role_data.role}' does not exist"
        )

    # Update role_id
    user_to_update.role_id = target_role.id
    db.commit()
    db.refresh(user_to_update)
    return user_to_update

@app.get("/api/superadmin/tenants", response_model=schemas.SuperAdminTenantsResponse)
def get_superadmin_tenants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can view tenant statistics"
        )

    orgs = db.query(models.Organization).all()
    tenants = []
    for org in orgs:
        u_count = db.query(models.User).filter(models.User.organization_id == org.id).count()
        tenants.append(
            schemas.TenantResponse(
                id=org.id,
                name=org.name,
                domain=org.domain,
                created_at=org.created_at,
                user_count=u_count
            )
        )

    total_tenants = len(orgs)
    total_users = db.query(models.User).count()

    return schemas.SuperAdminTenantsResponse(
        total_tenants=total_tenants,
        total_users=total_users,
        tenants=tenants
    )