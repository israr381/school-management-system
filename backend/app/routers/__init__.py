from app.routers.attendance import router as attendance_router
from app.routers.auth import router as auth_router
from app.routers.classes import router as classes_router
from app.routers.dashboard import router as dashboard_router
from app.routers.organizations import router as organizations_router
from app.routers.permissions import router as permissions_router
from app.routers.students import router as students_router
from app.routers.teacher_assignments import router as teacher_assignments_router
from app.routers.teachers import router as teachers_router
from app.routers.users import router as users_router

__all__ = [
    "attendance_router",
    "auth_router",
    "classes_router",
    "dashboard_router",
    "organizations_router",
    "permissions_router",
    "students_router",
    "teacher_assignments_router",
    "teachers_router",
    "users_router",
]

