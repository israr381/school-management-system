from app.routers.auth import router as auth_router
from app.routers.classes import router as classes_router
from app.routers.organizations import router as organizations_router
from app.routers.students import router as students_router
from app.routers.teachers import router as teachers_router
from app.routers.users import router as users_router

__all__ = [
    "auth_router",
    "classes_router",
    "organizations_router",
    "students_router",
    "teachers_router",
    "users_router",
]

