from sqlalchemy import inspect, text

from app.database import engine


def ensure_organization_logo_columns() -> None:
    inspector = inspect(engine)
    if "organizations" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("organizations")}

    with engine.begin() as connection:
        if "logo_url" not in columns:
            connection.execute(
                text("ALTER TABLE organizations ADD COLUMN logo_url VARCHAR")
            )
        if "logo_public_id" not in columns:
            connection.execute(
                text("ALTER TABLE organizations ADD COLUMN logo_public_id VARCHAR")
            )
        if "is_active" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE organizations ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"
                )
            )


def ensure_user_avatar_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "avatar_url" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
        if "avatar_public_id" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN avatar_public_id VARCHAR")
            )
