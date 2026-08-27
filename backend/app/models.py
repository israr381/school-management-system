from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, UniqueConstraint, false, true
from sqlalchemy.orm import object_session, relationship as orm_relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    logo_public_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, server_default=true(), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    users = orm_relationship("User", back_populates="organization", cascade="all, delete-orphan")
    classes = orm_relationship("SchoolClass", back_populates="organization", cascade="all, delete-orphan")
    subjects = orm_relationship("Subject", back_populates="organization", cascade="all, delete-orphan")
    parents = orm_relationship("Parent", back_populates="organization", cascade="all, delete-orphan")
    students = orm_relationship("Student", back_populates="organization", cascade="all, delete-orphan")
    teachers = orm_relationship("Teacher", back_populates="organization", cascade="all, delete-orphan")
    teacher_class_assignments = orm_relationship(
        "TeacherClassAssignment",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    organization_role_permissions = orm_relationship(
        "OrganizationRolePermission",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    leave_requests = orm_relationship(
        "LeaveRequest",
        back_populates="organization",
        cascade="all, delete-orphan",
    )

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    permissions = orm_relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
    )


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("module", "action", name="uq_permission_module_action"),
    )

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)

    roles = orm_relationship(
        "Role",
        secondary="role_permissions",
        back_populates="permissions",
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(
        Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True
    )


class OrganizationRolePermission(Base):
    __tablename__ = "organization_role_permissions"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "role_id",
            "permission_id",
            name="uq_org_role_permission",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(
        Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    organization = orm_relationship("Organization", back_populates="organization_role_permissions")
    role = orm_relationship("Role")
    permission = orm_relationship("Permission")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    avatar_url = Column(String, nullable=True)
    avatar_public_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False, server_default=false(), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = orm_relationship("Organization", back_populates="users")
    role_relation = orm_relationship("Role")
    student_profile = orm_relationship("Student", back_populates="user", uselist=False)
    parent_profile = orm_relationship("Parent", back_populates="user", uselist=False)
    teacher_profile = orm_relationship("Teacher", back_populates="user", uselist=False)

    @property
    def role(self) -> str:
        return self.role_relation.name if self.role_relation else ""

    @property
    def permissions(self) -> list[str]:
        role = self.role_relation
        if not role:
            return []

        if self.organization_id:
            session = object_session(self)
            if session is not None:
                has_org_rows = (
                    session.query(OrganizationRolePermission.id)
                    .filter(OrganizationRolePermission.organization_id == self.organization_id)
                    .first()
                )
                if has_org_rows:
                    rows = (
                        session.query(Permission.module, Permission.action)
                        .join(
                            OrganizationRolePermission,
                            OrganizationRolePermission.permission_id == Permission.id,
                        )
                        .filter(
                            OrganizationRolePermission.organization_id == self.organization_id,
                            OrganizationRolePermission.role_id == self.role_id,
                        )
                        .all()
                    )
                    return sorted(f"{module}.{action}" for module, action in rows)

        if not role.permissions:
            return []
        return sorted(f"{permission.module}.{permission.action}" for permission in role.permissions)


class SchoolClass(Base):
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_class_org_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = orm_relationship("Organization", back_populates="classes")
    sections = orm_relationship("Section", back_populates="school_class", cascade="all, delete-orphan")
    subjects = orm_relationship("Subject", back_populates="school_class", cascade="all, delete-orphan")
    students = orm_relationship("Student", back_populates="school_class")
    teacher_assignments = orm_relationship(
        "TeacherClassAssignment",
        back_populates="school_class",
        cascade="all, delete-orphan",
    )


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("class_id", "name", name="uq_section_class_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    school_class = orm_relationship("SchoolClass", back_populates="sections")
    organization = orm_relationship("Organization")
    subjects = orm_relationship("Subject", back_populates="section", cascade="all, delete-orphan")
    students = orm_relationship("Student", back_populates="section")
    teacher_assignments = orm_relationship(
        "TeacherClassAssignment",
        back_populates="section",
        cascade="all, delete-orphan",
    )


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("section_id", "name", name="uq_subject_section_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    school_class = orm_relationship("SchoolClass", back_populates="subjects")
    section = orm_relationship("Section", back_populates="subjects")
    organization = orm_relationship("Organization", back_populates="subjects")


class Parent(Base):
    __tablename__ = "parents"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_parent_org_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    relationship = Column(String, nullable=False, default="father")
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = orm_relationship("User", back_populates="parent_profile")
    organization = orm_relationship("Organization", back_populates="parents")
    students = orm_relationship("Student", back_populates="parent")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="RESTRICT"), nullable=False, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="RESTRICT"), nullable=False, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = orm_relationship("User", back_populates="student_profile")
    parent = orm_relationship("Parent", back_populates="students")
    organization = orm_relationship("Organization", back_populates="students")
    school_class = orm_relationship("SchoolClass", back_populates="students")
    section = orm_relationship("Section", back_populates="students")


class Teacher(Base):
    __tablename__ = "teachers"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_teacher_org_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    subject = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = orm_relationship("User", back_populates="teacher_profile")
    organization = orm_relationship("Organization", back_populates="teachers")
    class_assignment = orm_relationship(
        "TeacherClassAssignment",
        back_populates="teacher",
        uselist=False,
        cascade="all, delete-orphan",
    )


class TeacherClassAssignment(Base):
    __tablename__ = "teacher_class_assignments"
    __table_args__ = (
        UniqueConstraint("teacher_id", name="uq_teacher_one_class_assignment"),
    )

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(
        Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(
        Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    teacher = orm_relationship("Teacher", back_populates="class_assignment")
    school_class = orm_relationship("SchoolClass", back_populates="teacher_assignments")
    section = orm_relationship("Section", back_populates="teacher_assignments")
    organization = orm_relationship("Organization", back_populates="teacher_class_assignments")


class StudentAttendance(Base):
    __tablename__ = "student_attendance"
    __table_args__ = (
        UniqueConstraint("student_id", "attendance_date", name="uq_student_attendance_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(
        Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String, nullable=False, default="absent")
    marked_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = orm_relationship("Student")
    school_class = orm_relationship("SchoolClass")
    section = orm_relationship("Section")
    organization = orm_relationship("Organization")


class TeacherAttendance(Base):
    __tablename__ = "teacher_attendance"
    __table_args__ = (
        UniqueConstraint("teacher_id", "attendance_date", name="uq_teacher_attendance_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(
        Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String, nullable=False, default="absent")
    marked_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    teacher = orm_relationship("Teacher")
    organization = orm_relationship("Organization")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requester_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requester_role = Column(String, nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="SET NULL"), nullable=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True, index=True)
    request_type = Column(String, nullable=False, default="leave", index=True)
    from_date = Column(Date, nullable=False, index=True)
    to_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending", index=True)
    reviewer_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = orm_relationship("Organization", back_populates="leave_requests")
    requester = orm_relationship("User", foreign_keys=[requester_user_id])
    reviewer = orm_relationship("User", foreign_keys=[reviewer_user_id])
    student = orm_relationship("Student")
    teacher = orm_relationship("Teacher")
    school_class = orm_relationship("SchoolClass")
    section = orm_relationship("Section")
