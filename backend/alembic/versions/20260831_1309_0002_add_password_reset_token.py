"""Add password reset token columns to users.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    columns = {col["name"] for col in inspector.get_columns("users")}

    if "password_reset_token_hash" not in columns:
        op.add_column("users", sa.Column("password_reset_token_hash", sa.String(), nullable=True))
    if "password_reset_expires_at" not in columns:
        op.add_column("users", sa.Column("password_reset_expires_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    columns = {col["name"] for col in inspector.get_columns("users")}

    if "password_reset_expires_at" in columns:
        op.drop_column("users", "password_reset_expires_at")
    if "password_reset_token_hash" in columns:
        op.drop_column("users", "password_reset_token_hash")
