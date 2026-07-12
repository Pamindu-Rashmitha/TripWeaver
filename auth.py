import os
import jwt
from jwt import PyJWKClient
from typing import Optional
from dataclasses import dataclass
from fastapi import Request, HTTPException, status

@dataclass
class UserInfo:
    """Authenticated user information extracted from Clerk JWT."""
    user_id: str
    email: str
    name: str

_jwks_client: Optional[PyJWKClient] = None

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client:
        return _jwks_client

    jwks_url = os.getenv("CLERK_JWKS_URL")
    if not jwks_url:
        pk = os.getenv("CLERK_PUBLISHABLE_KEY", "")
        if pk.startswith("pk_test_") or pk.startswith("pk_live_"):
            import base64
            encoded = pk.split("_", 2)[2]
            padded = encoded + "=" * (4 - len(encoded) % 4) if len(encoded) % 4 else encoded
            try:
                domain = base64.b64decode(padded).decode("utf-8").rstrip("$")
                jwks_url = f"https://{domain}/.well-known/jwks.json"
            except Exception:
                pass

    if not jwks_url:
        raise ValueError("Cannot determine Clerk JWKS URL.")

    _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client

async def verify_clerk_token(token: str) -> Optional[UserInfo]:
    """
    Verify a Clerk JWT and extract user info.
    Returns UserInfo on success, None on failure.
    """
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False},
        )

        user_id = payload.get("sub", "")
        email = payload.get("email", "") or ""
        name = payload.get("name", "") or ""

        if not email:
            metadata = payload.get("user_metadata", {})
            email = metadata.get("email", "")
        if not name:
            first = payload.get("first_name", "")
            last = payload.get("last_name", "")
            name = f"{first} {last}".strip()

        return UserInfo(user_id=user_id, email=email, name=name)

    except Exception as e:
        import sys
        print(f"Clerk token verification failed: {e}")
        sys.stdout.flush()
        return None

async def get_required_user(request: Request) -> UserInfo:
    """
    FastAPI dependency: extracts user from Authorization header and verifies it.
    Raises HTTPException 401 for unauthenticated requests.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials.",
        )

    token = auth_header[7:]
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials.",
        )

    user = await verify_clerk_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    return user

