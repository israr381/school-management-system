import os
import uuid
from typing import Tuple

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
ALLOWED_LOGO_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
}

_cloudinary_configured = False


def _ensure_cloudinary_configured() -> None:
    global _cloudinary_configured

    if _cloudinary_configured:
        return

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on the server.",
        )

    cloudinary.config(  
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    _cloudinary_configured = True


def validate_logo_file(content_type: str | None, file_size: int) -> None:
    if content_type not in ALLOWED_LOGO_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must be a PNG, JPG, WEBP, or SVG image.",
        )

    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded logo file is empty.",
        )

    if file_size > MAX_LOGO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo file must be 2MB or smaller.",
        )


def _cloudinary_error_detail(action: str, error: Exception) -> str:
    message = str(error)
    if any(
        token in message
        for token in (
            "Failed to resolve",
            "NameResolutionError",
            "MaxRetryError",
            "Network is unreachable",
            "Connection refused",
            "timed out",
        )
    ):
        return (
            f"Could not reach Cloudinary while trying to {action}. "
            "Check your internet connection, VPN, firewall, or DNS settings, then try again."
        )

    if any(
        token in message
        for token in ("missing permissions", "Request forbidden", 'actions=["create"]')
    ):
        return (
            "Cloudinary rejected the upload because your API key lacks create/upload permission. "
            "In the Cloudinary dashboard go to Settings → Security → API Keys, then either use "
            "the primary API key or edit your key and enable Upload / Create permissions."
        )

    if any(
        token in message
        for token in ("Invalid cloud_name", "Invalid API", "Unauthorized", "401")
    ):
        return (
            f"Cloudinary rejected the request while trying to {action}. "
            "Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and "
            "CLOUDINARY_API_SECRET in backend/.env match your Cloudinary dashboard."
        )

    return f"Cloudinary {action} failed: {error}"


def _staging_prefix(org_id: int) -> str:
    return f"organizations/{org_id}/staging/"


def assert_staging_public_id(org_id: int, public_id: str) -> None:
    if not public_id.startswith(_staging_prefix(org_id)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid staging logo reference.",
        )


def assert_org_logo_public_id(org_id: int, public_id: str) -> None:
    if not public_id.startswith(f"organizations/{org_id}/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization logo reference.",
        )


def upload_organization_logo_staging(file_bytes: bytes, org_id: int) -> Tuple[str, str]:
    _ensure_cloudinary_configured()

    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"organizations/{org_id}/staging",
            public_id=uuid.uuid4().hex,
            resource_type="image",
            timeout=60,
        )
    except CloudinaryError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_cloudinary_error_detail("upload the logo", error),
        ) from error

    return result["secure_url"], result["public_id"]


def delete_organization_logo(public_id: str | None) -> None:
    if not public_id:
        return

    _ensure_cloudinary_configured()
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image", timeout=30)
    except CloudinaryError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_cloudinary_error_detail("delete the logo", error),
        ) from error
