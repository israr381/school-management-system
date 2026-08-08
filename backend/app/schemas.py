from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class OrganizationResponse(BaseModel):
    id: int
    name: str
    domain: str

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

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    organization_id: Optional[int] = None
    organization: Optional[OrganizationResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str = Field(..., min_length=1)

class TenantResponse(BaseModel):
    id: int
    name: str
    domain: str
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
    admin_password: str = Field(..., min_length=6)

class OrganizationUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    domain: str = Field(..., min_length=3)
