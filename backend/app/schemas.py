from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional, List
from datetime import datetime

class OrganizationResponse(BaseModel):
    id: int
    name: str
    domain: str
    logo_url: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")
    full_name: str = Field(..., min_length=1, description="Full name is required")
    organization_name: Optional[str] = Field(None, description="Organization name")
    organization_domain: Optional[str] = Field(None, description="Organization domain (e.g. school.edu)")

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    organization_id: Optional[int] = None
    organization: Optional[OrganizationResponse] = None
    must_change_password: bool = False

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    remember_me: bool = False
    must_change_password: bool = False

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str = Field(..., min_length=1)

class TenantResponse(BaseModel):
    id: int
    name: str
    domain: str
    logo_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    user_count: int

    class Config:
        from_attributes = True

class SuperAdminTenantsResponse(BaseModel):
    total_tenants: int
    total_users: int
    tenants: List[TenantResponse]

class CreateOrganizationRequest(BaseModel):
    organization_name: str = Field(..., min_length=1)
    organization_domain: str = Field(..., min_length=3)
    admin_full_name: str = Field(..., min_length=1)
    admin_email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)

class OrganizationUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    domain: str = Field(..., min_length=3)

class LogoStagingResponse(BaseModel):
    logo_url: str
    logo_public_id: str

class OrganizationLogoCommit(BaseModel):
    logo_url: Optional[str] = None
    logo_public_id: Optional[str] = None

class OrganizationStatusUpdate(BaseModel):
    is_active: bool

class AvatarStagingResponse(BaseModel):
    avatar_url: str
    avatar_public_id: str

class UserAvatarCommit(BaseModel):
    avatar_url: Optional[str] = None
    avatar_public_id: Optional[str] = None


class ClassCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class ClassUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class ClassResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    section_count: int = 0
    student_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SectionCreate(BaseModel):
    name: str = Field(..., min_length=1)
    class_id: int


class SectionUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    class_id: int


class SectionResponse(BaseModel):
    id: int
    name: str
    class_id: int
    class_name: str
    student_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ParentResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    relationship: str
    address: Optional[str] = None
    student_count: int = 0

    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=6)
    address: str = Field(..., min_length=1)
    class_id: int
    section_id: int
    parent_id: Optional[int] = None
    parent_full_name: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = None
    parent_relationship: Optional[Literal["father", "guardian"]] = "father"
    parent_address: Optional[str] = None


class StudentUpdate(StudentCreate):
    status: Literal["active", "graduated", "disabled"] = "active"


class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    address: str
    status: str
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    created_at: datetime
    parent: ParentResponse

    class Config:
        from_attributes = True


class ClassStudentCount(BaseModel):
    class_id: int
    class_name: str
    count: int


class StudentStatsResponse(BaseModel):
    total_students: int
    active_students: int
    graduated_students: int
    disabled_students: int
    by_class: List[ClassStudentCount]


class TeacherCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=6)
    address: str = Field(..., min_length=1)
    subject: Optional[str] = None


class TeacherUpdate(TeacherCreate):
    status: Literal["active", "disabled"] = "active"


class TeacherResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    address: str
    subject: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherStatsResponse(BaseModel):
    total_teachers: int
    active_teachers: int
    disabled_teachers: int
