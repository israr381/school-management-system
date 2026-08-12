from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, check_db_connection, engine, get_db
from app.db_migrations import ensure_organization_logo_columns
from app import models
from app.routers.auth import router as auth_router
from app.routers.organizations import router as organizations_router
from app.routers.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_organization_logo_columns()

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

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(organizations_router)


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
        "database_status": db_status,
    }
