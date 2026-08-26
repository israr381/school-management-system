from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional, List
from datetime import date, datetime

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
    permissions: List[str] = []

    class Config:
        from_attributes = True


class PermissionModuleCatalog(BaseModel):
    key: str
    label: str
    actions: List[str]


class RoleResponse(BaseModel):
    id: int
    name: str
    label: str
    permissions: List[str]


class RolePermissionsUpdate(BaseModel):
    permissions: List[str]

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


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    class_id: int
    section_id: int


class SubjectUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    class_id: int
    section_id: int


class SubjectResponse(BaseModel):
    id: int
    name: str
    class_id: int
    class_name: str
    section_id: int
    section_name: str
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
    avatar_url: Optional[str] = None
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
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherStatsResponse(BaseModel):
    total_teachers: int
    active_teachers: int
    disabled_teachers: int


class TeacherClassAssignmentCreate(BaseModel):
    teacher_id: int
    class_id: int
    section_id: int


class TeacherClassAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


AttendanceStatus = Literal["present", "absent", "late", "leave"]


class StudentAttendanceRecordIn(BaseModel):
    student_id: int
    status: AttendanceStatus


class StudentAttendanceSave(BaseModel):
    attendance_date: date
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    records: List[StudentAttendanceRecordIn]


class StudentAttendanceRecordOut(BaseModel):
    student_id: int
    full_name: str
    status: AttendanceStatus
    on_leave: bool = False


class StudentAttendanceSheet(BaseModel):
    attendance_date: date
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    locked: bool
    is_saved: bool
    can_edit: bool
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    records: List[StudentAttendanceRecordOut]


class StudentAttendanceSummary(BaseModel):
    attendance_date: date
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    can_edit: bool


class TeacherAttendanceRecordIn(BaseModel):
    teacher_id: int
    status: AttendanceStatus


class TeacherAttendanceSave(BaseModel):
    attendance_date: date
    records: List[TeacherAttendanceRecordIn]


class TeacherAttendanceRecordOut(BaseModel):
    teacher_id: int
    full_name: str
    status: AttendanceStatus
    on_leave: bool = False


class TeacherAttendanceSheet(BaseModel):
    attendance_date: date
    is_saved: bool
    can_edit: bool
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    records: List[TeacherAttendanceRecordOut]


class TeacherAttendanceSummary(BaseModel):
    attendance_date: date
    total_teachers: int
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    can_edit: bool


class MyAttendanceRecord(BaseModel):
    attendance_date: date
    status: AttendanceStatus
    class_name: Optional[str] = None
    section_name: Optional[str] = None


class MyAttendanceResponse(BaseModel):
    person_type: Literal["student", "teacher"]
    full_name: str
    records: List[MyAttendanceRecord]


RequestType = Literal["leave"]
RequestStatus = Literal["pending", "approved", "rejected", "cancelled"]
RequesterRole = Literal["student", "teacher"]


class LeaveRequestCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str = Field(..., min_length=3, max_length=2000)


class LeaveRequestUpdate(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    reason: Optional[str] = Field(None, min_length=3, max_length=2000)


class LeaveRequestReview(BaseModel):
    status: Literal["approved", "rejected"]
    review_note: Optional[str] = Field(None, max_length=1000)


class LeaveRequestResponse(BaseModel):
    id: int
    request_type: RequestType
    requester_role: RequesterRole
    requester_name: str
    requester_email: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    from_date: date
    to_date: date
    days: int
    reason: str
    status: RequestStatus
    review_note: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    can_cancel: bool = False
    can_review: bool = False
    can_delete: bool = False


class PendingRequestCounts(BaseModel):
    total: int
    student: int
    teacher: int


class AttendanceTotals(BaseModel):
    total: int
    present: int
    absent: int
    late: int
    leave: int = 0
    percent: float


class AttendanceTrendPoint(BaseModel):
    date: date
    label: str
    percent: float
    recorded: bool
    present: int = 0
    absent: int = 0
    late: int = 0
    leave: int = 0
    total: int = 0


class DashboardAttendanceRecord(BaseModel):
    attendance_date: date
    status: AttendanceStatus
    class_name: Optional[str] = None
    section_name: Optional[str] = None


class DashboardStudentCard(BaseModel):
    id: int
    full_name: str
    status: str
    class_name: str
    section_name: str
    avatar_url: Optional[str] = None
    today_status: Optional[AttendanceStatus] = None
    attendance: AttendanceTotals
    recent: List[DashboardAttendanceRecord] = []
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    parent_relationship: Optional[str] = None


class TeacherClassDaySummary(BaseModel):
    attendance_date: date
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    percent: float


class TeacherDashboardData(BaseModel):
    assigned: bool
    teacher_id: Optional[int] = None
    subject: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    student_count: int = 0
    today_taken: bool = False
    today_status: Optional[AttendanceStatus] = None
    today_class: AttendanceTotals
    class_attendance: AttendanceTotals
    my_attendance: AttendanceTotals
    trend: List[AttendanceTrendPoint] = []
    students: List[DashboardStudentCard] = []
    recent_class_days: List[TeacherClassDaySummary] = []
    recent_my_attendance: List[DashboardAttendanceRecord] = []


class StudentDashboardData(BaseModel):
    student_id: int
    full_name: str
    status: str
    class_name: str
    section_name: str
    avatar_url: Optional[str] = None
    today_status: Optional[AttendanceStatus] = None
    parent_name: str
    parent_phone: str
    parent_email: str
    parent_relationship: str
    attendance: AttendanceTotals
    trend: List[AttendanceTrendPoint] = []
    recent: List[DashboardAttendanceRecord] = []


class ParentDashboardData(BaseModel):
    parent_id: int
    full_name: str
    relationship: str
    children_count: int
    today_present: int
    today_absent: int
    combined_attendance: AttendanceTotals
    trend: List[AttendanceTrendPoint] = []
    children: List[DashboardStudentCard] = []


class AdminClassDistribution(BaseModel):
    class_id: int
    class_name: str
    count: int
    percent: float


class AdminTopStudent(BaseModel):
    id: int
    full_name: str
    class_name: str
    section_name: str
    avatar_url: Optional[str] = None
    attendance_percent: float
    total_days: int


class AdminRecentStudent(BaseModel):
    id: int
    full_name: str
    class_name: str
    section_name: str
    created_at: datetime
    avatar_url: Optional[str] = None


class AdminRecentClassDay(BaseModel):
    attendance_date: date
    class_name: str
    section_name: str
    present_count: int
    absent_count: int
    late_count: int
    leave_count: int = 0
    total_students: int
    percent: float


class AdminDashboardData(BaseModel):
    academic_year: str
    total_students: int
    active_students: int
    total_teachers: int
    active_teachers: int
    total_parents: int
    active_classes: int
    today_student: AttendanceTotals
    student_attendance: AttendanceTotals
    today_teacher: AttendanceTotals
    teacher_attendance: AttendanceTotals
    trend: List[AttendanceTrendPoint] = []
    by_class: List[AdminClassDistribution] = []
    top_students: List[AdminTopStudent] = []
    recent_students: List[AdminRecentStudent] = []
    recent_class_days: List[AdminRecentClassDay] = []


class RoleDashboardResponse(BaseModel):
    role: Literal["admin", "teacher", "student", "parent"]
    admin: Optional[AdminDashboardData] = None
    teacher: Optional[TeacherDashboardData] = None
    student: Optional[StudentDashboardData] = None
    parent: Optional[ParentDashboardData] = None
