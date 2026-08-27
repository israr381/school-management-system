"""Initial schema matching current SQLAlchemy models.

Revision ID: 0001
Revises:
Create Date: 2026-08-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _schema_already_present() -> bool:
    inspector = inspect(op.get_bind())
    return "organizations" in inspector.get_table_names()


def upgrade() -> None:
    if _schema_already_present():
        return

    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("domain", sa.String(), nullable=False),
        sa.Column("logo_url", sa.String(), nullable=True),
        sa.Column("logo_public_id", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_domain"), "organizations", ["domain"], unique=True)
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("module", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("module", "action", name="uq_permission_module_action"),
    )
    op.create_index(op.f("ix_permissions_id"), "permissions", ["id"], unique=False)
    op.create_index(op.f("ix_permissions_module"), "permissions", ["module"], unique=False)
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)
    op.create_table(
        "classes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "name", name="uq_class_org_name"),
    )
    op.create_index(op.f("ix_classes_id"), "classes", ["id"], unique=False)
    op.create_index(op.f("ix_classes_organization_id"), "classes", ["organization_id"], unique=False)
    op.create_table(
        "organization_role_permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "role_id",
            "permission_id",
            name="uq_org_role_permission",
        ),
    )
    op.create_index(
        op.f("ix_organization_role_permissions_id"),
        "organization_role_permissions",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_role_permissions_organization_id"),
        "organization_role_permissions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_role_permissions_permission_id"),
        "organization_role_permissions",
        ["permission_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_role_permissions_role_id"),
        "organization_role_permissions",
        ["role_id"],
        unique=False,
    )
    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )
    op.create_index(op.f("ix_role_permissions_id"), "role_permissions", ["id"], unique=False)
    op.create_index(
        op.f("ix_role_permissions_permission_id"),
        "role_permissions",
        ["permission_id"],
        unique=False,
    )
    op.create_index(op.f("ix_role_permissions_role_id"), "role_permissions", ["role_id"], unique=False)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("avatar_public_id", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("must_change_password", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_table(
        "parents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("relationship", sa.String(), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "email", name="uq_parent_org_email"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_parents_email"), "parents", ["email"], unique=False)
    op.create_index(op.f("ix_parents_id"), "parents", ["id"], unique=False)
    op.create_index(op.f("ix_parents_organization_id"), "parents", ["organization_id"], unique=False)
    op.create_table(
        "sections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("class_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("class_id", "name", name="uq_section_class_name"),
    )
    op.create_index(op.f("ix_sections_class_id"), "sections", ["class_id"], unique=False)
    op.create_index(op.f("ix_sections_id"), "sections", ["id"], unique=False)
    op.create_index(op.f("ix_sections_organization_id"), "sections", ["organization_id"], unique=False)
    op.create_table(
        "teachers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "email", name="uq_teacher_org_email"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_teachers_email"), "teachers", ["email"], unique=False)
    op.create_index(op.f("ix_teachers_id"), "teachers", ["id"], unique=False)
    op.create_index(op.f("ix_teachers_organization_id"), "teachers", ["organization_id"], unique=False)
    op.create_index(op.f("ix_teachers_status"), "teachers", ["status"], unique=False)
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("class_id", sa.Integer(), nullable=False),
        sa.Column("section_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["parents.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_students_class_id"), "students", ["class_id"], unique=False)
    op.create_index(op.f("ix_students_email"), "students", ["email"], unique=False)
    op.create_index(op.f("ix_students_id"), "students", ["id"], unique=False)
    op.create_index(op.f("ix_students_organization_id"), "students", ["organization_id"], unique=False)
    op.create_index(op.f("ix_students_parent_id"), "students", ["parent_id"], unique=False)
    op.create_index(op.f("ix_students_section_id"), "students", ["section_id"], unique=False)
    op.create_index(op.f("ix_students_status"), "students", ["status"], unique=False)
    op.create_table(
        "subjects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("class_id", sa.Integer(), nullable=False),
        sa.Column("section_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("section_id", "name", name="uq_subject_section_name"),
    )
    op.create_index(op.f("ix_subjects_class_id"), "subjects", ["class_id"], unique=False)
    op.create_index(op.f("ix_subjects_id"), "subjects", ["id"], unique=False)
    op.create_index(op.f("ix_subjects_organization_id"), "subjects", ["organization_id"], unique=False)
    op.create_index(op.f("ix_subjects_section_id"), "subjects", ["section_id"], unique=False)
    op.create_table(
        "teacher_attendance",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("marked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["marked_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("teacher_id", "attendance_date", name="uq_teacher_attendance_date"),
    )
    op.create_index(
        op.f("ix_teacher_attendance_attendance_date"),
        "teacher_attendance",
        ["attendance_date"],
        unique=False,
    )
    op.create_index(op.f("ix_teacher_attendance_id"), "teacher_attendance", ["id"], unique=False)
    op.create_index(
        op.f("ix_teacher_attendance_organization_id"),
        "teacher_attendance",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_teacher_attendance_teacher_id"),
        "teacher_attendance",
        ["teacher_id"],
        unique=False,
    )
    op.create_table(
        "teacher_class_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.Integer(), nullable=False),
        sa.Column("class_id", sa.Integer(), nullable=False),
        sa.Column("section_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("teacher_id", name="uq_teacher_one_class_assignment"),
    )
    op.create_index(
        op.f("ix_teacher_class_assignments_class_id"),
        "teacher_class_assignments",
        ["class_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_teacher_class_assignments_id"),
        "teacher_class_assignments",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_teacher_class_assignments_organization_id"),
        "teacher_class_assignments",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_teacher_class_assignments_section_id"),
        "teacher_class_assignments",
        ["section_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_teacher_class_assignments_teacher_id"),
        "teacher_class_assignments",
        ["teacher_id"],
        unique=False,
    )
    op.create_table(
        "leave_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("requester_user_id", sa.Integer(), nullable=False),
        sa.Column("requester_role", sa.String(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=True),
        sa.Column("teacher_id", sa.Integer(), nullable=True),
        sa.Column("class_id", sa.Integer(), nullable=True),
        sa.Column("section_id", sa.Integer(), nullable=True),
        sa.Column("request_type", sa.String(), nullable=False),
        sa.Column("from_date", sa.Date(), nullable=False),
        sa.Column("to_date", sa.Date(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("reviewer_user_id", sa.Integer(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requester_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leave_requests_class_id"), "leave_requests", ["class_id"], unique=False)
    op.create_index(op.f("ix_leave_requests_from_date"), "leave_requests", ["from_date"], unique=False)
    op.create_index(op.f("ix_leave_requests_id"), "leave_requests", ["id"], unique=False)
    op.create_index(
        op.f("ix_leave_requests_organization_id"),
        "leave_requests",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_leave_requests_request_type"),
        "leave_requests",
        ["request_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_leave_requests_requester_role"),
        "leave_requests",
        ["requester_role"],
        unique=False,
    )
    op.create_index(
        op.f("ix_leave_requests_requester_user_id"),
        "leave_requests",
        ["requester_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_leave_requests_section_id"), "leave_requests", ["section_id"], unique=False)
    op.create_index(op.f("ix_leave_requests_status"), "leave_requests", ["status"], unique=False)
    op.create_index(op.f("ix_leave_requests_student_id"), "leave_requests", ["student_id"], unique=False)
    op.create_index(op.f("ix_leave_requests_teacher_id"), "leave_requests", ["teacher_id"], unique=False)
    op.create_table(
        "student_attendance",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("class_id", sa.Integer(), nullable=False),
        sa.Column("section_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("marked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["marked_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "attendance_date", name="uq_student_attendance_date"),
    )
    op.create_index(
        op.f("ix_student_attendance_attendance_date"),
        "student_attendance",
        ["attendance_date"],
        unique=False,
    )
    op.create_index(op.f("ix_student_attendance_class_id"), "student_attendance", ["class_id"], unique=False)
    op.create_index(op.f("ix_student_attendance_id"), "student_attendance", ["id"], unique=False)
    op.create_index(
        op.f("ix_student_attendance_organization_id"),
        "student_attendance",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_attendance_section_id"),
        "student_attendance",
        ["section_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_student_attendance_student_id"),
        "student_attendance",
        ["student_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_student_attendance_student_id"), table_name="student_attendance")
    op.drop_index(op.f("ix_student_attendance_section_id"), table_name="student_attendance")
    op.drop_index(op.f("ix_student_attendance_organization_id"), table_name="student_attendance")
    op.drop_index(op.f("ix_student_attendance_id"), table_name="student_attendance")
    op.drop_index(op.f("ix_student_attendance_class_id"), table_name="student_attendance")
    op.drop_index(op.f("ix_student_attendance_attendance_date"), table_name="student_attendance")
    op.drop_table("student_attendance")
    op.drop_index(op.f("ix_leave_requests_teacher_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_student_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_status"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_section_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_requester_user_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_requester_role"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_request_type"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_organization_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_id"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_from_date"), table_name="leave_requests")
    op.drop_index(op.f("ix_leave_requests_class_id"), table_name="leave_requests")
    op.drop_table("leave_requests")
    op.drop_index(op.f("ix_teacher_class_assignments_teacher_id"), table_name="teacher_class_assignments")
    op.drop_index(op.f("ix_teacher_class_assignments_section_id"), table_name="teacher_class_assignments")
    op.drop_index(
        op.f("ix_teacher_class_assignments_organization_id"),
        table_name="teacher_class_assignments",
    )
    op.drop_index(op.f("ix_teacher_class_assignments_id"), table_name="teacher_class_assignments")
    op.drop_index(op.f("ix_teacher_class_assignments_class_id"), table_name="teacher_class_assignments")
    op.drop_table("teacher_class_assignments")
    op.drop_index(op.f("ix_teacher_attendance_teacher_id"), table_name="teacher_attendance")
    op.drop_index(op.f("ix_teacher_attendance_organization_id"), table_name="teacher_attendance")
    op.drop_index(op.f("ix_teacher_attendance_id"), table_name="teacher_attendance")
    op.drop_index(op.f("ix_teacher_attendance_attendance_date"), table_name="teacher_attendance")
    op.drop_table("teacher_attendance")
    op.drop_index(op.f("ix_subjects_section_id"), table_name="subjects")
    op.drop_index(op.f("ix_subjects_organization_id"), table_name="subjects")
    op.drop_index(op.f("ix_subjects_id"), table_name="subjects")
    op.drop_index(op.f("ix_subjects_class_id"), table_name="subjects")
    op.drop_table("subjects")
    op.drop_index(op.f("ix_students_status"), table_name="students")
    op.drop_index(op.f("ix_students_section_id"), table_name="students")
    op.drop_index(op.f("ix_students_parent_id"), table_name="students")
    op.drop_index(op.f("ix_students_organization_id"), table_name="students")
    op.drop_index(op.f("ix_students_id"), table_name="students")
    op.drop_index(op.f("ix_students_email"), table_name="students")
    op.drop_index(op.f("ix_students_class_id"), table_name="students")
    op.drop_table("students")
    op.drop_index(op.f("ix_teachers_status"), table_name="teachers")
    op.drop_index(op.f("ix_teachers_organization_id"), table_name="teachers")
    op.drop_index(op.f("ix_teachers_id"), table_name="teachers")
    op.drop_index(op.f("ix_teachers_email"), table_name="teachers")
    op.drop_table("teachers")
    op.drop_index(op.f("ix_sections_organization_id"), table_name="sections")
    op.drop_index(op.f("ix_sections_id"), table_name="sections")
    op.drop_index(op.f("ix_sections_class_id"), table_name="sections")
    op.drop_table("sections")
    op.drop_index(op.f("ix_parents_organization_id"), table_name="parents")
    op.drop_index(op.f("ix_parents_id"), table_name="parents")
    op.drop_index(op.f("ix_parents_email"), table_name="parents")
    op.drop_table("parents")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_role_permissions_role_id"), table_name="role_permissions")
    op.drop_index(op.f("ix_role_permissions_permission_id"), table_name="role_permissions")
    op.drop_index(op.f("ix_role_permissions_id"), table_name="role_permissions")
    op.drop_table("role_permissions")
    op.drop_index(op.f("ix_organization_role_permissions_role_id"), table_name="organization_role_permissions")
    op.drop_index(
        op.f("ix_organization_role_permissions_permission_id"),
        table_name="organization_role_permissions",
    )
    op.drop_index(
        op.f("ix_organization_role_permissions_organization_id"),
        table_name="organization_role_permissions",
    )
    op.drop_index(op.f("ix_organization_role_permissions_id"), table_name="organization_role_permissions")
    op.drop_table("organization_role_permissions")
    op.drop_index(op.f("ix_classes_organization_id"), table_name="classes")
    op.drop_index(op.f("ix_classes_id"), table_name="classes")
    op.drop_table("classes")
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_index(op.f("ix_roles_id"), table_name="roles")
    op.drop_table("roles")
    op.drop_index(op.f("ix_permissions_module"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_id"), table_name="permissions")
    op.drop_table("permissions")
    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_domain"), table_name="organizations")
    op.drop_table("organizations")
