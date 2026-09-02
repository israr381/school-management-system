"""Add is_active / deleted_at soft-delete columns.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, Sequence[str], None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES_NEEDING_IS_ACTIVE = (
    "classes",
    "sections",
    "subjects",
    "parents",
    "students",
    "teachers",
    "teacher_class_assignments",
    "student_attendance",
    "teacher_attendance",
    "leave_requests",
)

TABLES_NEEDING_DELETED_AT = (
    "organizations",
    "users",
    *TABLES_NEEDING_IS_ACTIVE,
)

PARTIAL_UNIQUES = (
    ("organizations", "ix_organizations_domain", ["domain"]),
    ("users", "ix_users_email", ["email"]),
    ("classes", "uq_class_org_name", ["organization_id", "name"]),
    ("sections", "uq_section_class_name", ["class_id", "name"]),
    ("subjects", "uq_subject_section_name", ["section_id", "name"]),
    ("parents", "uq_parent_org_email", ["organization_id", "email"]),
    ("teachers", "uq_teacher_org_email", ["organization_id", "email"]),
    ("teacher_class_assignments", "uq_teacher_one_class_assignment", ["teacher_id"]),
    ("student_attendance", "uq_student_attendance_date", ["student_id", "attendance_date"]),
    ("teacher_attendance", "uq_teacher_attendance_date", ["teacher_id", "attendance_date"]),
)


def _column_names(table: str) -> set[str]:
    return {col["name"] for col in inspect(op.get_bind()).get_columns(table)}


def _index_names(table: str) -> set[str]:
    return {item["name"] for item in inspect(op.get_bind()).get_indexes(table)}


def _unique_names(table: str) -> set[str]:
    return {item["name"] for item in inspect(op.get_bind()).get_unique_constraints(table)}


def _index_is_partial(name: str) -> bool:
    result = op.get_bind().execute(
        sa.text("SELECT indexdef FROM pg_indexes WHERE indexname = :name"),
        {"name": name},
    ).scalar()
    return bool(result) and "WHERE" in str(result).upper()


def _replace_with_partial_unique(table: str, name: str, columns: list[str]) -> None:
    if _index_is_partial(name):
        return
    if name in _unique_names(table):
        op.drop_constraint(name, table_name=table, type_="unique")
    elif name in _index_names(table):
        op.drop_index(name, table_name=table)
    op.create_index(
        name,
        table,
        columns,
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())

    for table in TABLES_NEEDING_IS_ACTIVE:
        if table not in tables:
            continue
        columns = _column_names(table)
        if "is_active" not in columns:
            op.add_column(
                table,
                sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
            )

    for table in TABLES_NEEDING_DELETED_AT:
        if table not in tables:
            continue
        columns = _column_names(table)
        if "deleted_at" not in columns:
            op.add_column(table, sa.Column("deleted_at", sa.DateTime(), nullable=True))
        index_name = f"ix_{table}_deleted_at"
        if index_name not in _index_names(table):
            op.create_index(index_name, table, ["deleted_at"])

    for table, name, columns in PARTIAL_UNIQUES:
        if table in tables:
            _replace_with_partial_unique(table, name, columns)


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())

    for table, name, columns in PARTIAL_UNIQUES:
        if table not in tables:
            continue
        if name in _unique_names(table) or name in _index_names(table):
            if name in _unique_names(table):
                op.drop_constraint(name, table_name=table, type_="unique")
            else:
                op.drop_index(name, table_name=table)
        op.create_index(name, table, columns, unique=True)

    for table in TABLES_NEEDING_DELETED_AT:
        if table not in tables:
            continue
        index_name = f"ix_{table}_deleted_at"
        if index_name in _index_names(table):
            op.drop_index(index_name, table_name=table)
        if "deleted_at" in _column_names(table):
            op.drop_column(table, "deleted_at")

    for table in TABLES_NEEDING_IS_ACTIVE:
        if table not in tables:
            continue
        if "is_active" in _column_names(table):
            op.drop_column(table, "is_active")
