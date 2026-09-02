"""Add created_at / updated_at timestamps to every table.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, Sequence[str], None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ALL_TABLES = (
    "organizations",
    "roles",
    "permissions",
    "role_permissions",
    "organization_role_permissions",
    "users",
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


def _columns(table: str) -> dict:
    return {col["name"]: col for col in inspect(op.get_bind()).get_columns(table)}


def _ensure_timestamp(table: str, column: str) -> None:
    columns = _columns(table)
    now = sa.text("now()")
    if column not in columns:
        op.add_column(
            table,
            sa.Column(column, sa.DateTime(), server_default=now, nullable=False),
        )
        return

    if columns[column]["nullable"]:
        op.execute(sa.text(f"UPDATE {table} SET {column} = now() WHERE {column} IS NULL"))
        op.alter_column(table, column, existing_type=sa.DateTime(), nullable=False)


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    for table in ALL_TABLES:
        if table not in tables:
            continue
        _ensure_timestamp(table, "created_at")
        _ensure_timestamp(table, "updated_at")


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    added_created_at = {
        "roles",
        "permissions",
        "role_permissions",
        "organization_role_permissions",
    }
    added_updated_at = {
        "organizations",
        "roles",
        "permissions",
        "role_permissions",
        "organization_role_permissions",
        "users",
        "parents",
        "students",
        "teachers",
    }
    for table in ALL_TABLES:
        if table not in tables:
            continue
        columns = _columns(table)
        if table in added_updated_at and "updated_at" in columns:
            op.drop_column(table, "updated_at")
        if table in added_created_at and "created_at" in columns:
            op.drop_column(table, "created_at")
