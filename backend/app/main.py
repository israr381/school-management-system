from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import check_db_connection, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    if check_db_connection():
        print("Database run correctly")
    else:
        print("Database connection FAILED")
    yield

app = FastAPI(lifespan=lifespan)


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