from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship as orm_relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    logo_public_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = orm_relationship("User", back_populates="organization", cascade="all, delete-orphan")
    classes = orm_relationship("SchoolClass", back_populates="organization", cascade="all, delete-orphan")
    parents = orm_relationship("Parent", back_populates="organization", cascade="all, delete-orphan")
    students = orm_relationship("Student", back_populates="organization", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

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
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organization = orm_relationship("Organization", back_populates="users")
    role_relation = orm_relationship("Role")
    student_profile = orm_relationship("Student", back_populates="user", uselist=False)
    parent_profile = orm_relationship("Parent", back_populates="user", uselist=False)

    @property
    def role(self) -> str:
        return self.role_relation.name if self.role_relation else ""


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
    students = orm_relationship("Student", back_populates="school_class")


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
    students = orm_relationship("Student", back_populates="section")


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
