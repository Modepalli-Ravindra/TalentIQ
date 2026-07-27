from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserLoginRequest, UserRegisterRequest, TokenResponse
from app.core.security import create_access_token, get_password_hash, verify_password

router = APIRouter()


def _get_db():
    from app.core.supabase import get_supabase_client
    return get_supabase_client()


@router.post("/login")
def login(payload: UserLoginRequest):
    db = _get_db()
    result = db.table("profiles").select("*").eq("email", payload.email).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    stored_hash = user.get("password_hash", "")
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=user["id"], role=user.get("role", "candidate"))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user.get("name", ""),
            "email": user["email"],
            "role": user.get("role", "candidate"),
            "avatar": user.get("avatar_url", ""),
        },
    }


@router.post("/register")
def register(payload: UserRegisterRequest):
    db = _get_db()

    existing = db.table("profiles").select("id").eq("email", payload.email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    import uuid
    user_id = str(uuid.uuid4())

    new_user = {
        "id": user_id,
        "email": payload.email,
        "name": payload.name,
        "role": payload.role,
        "password_hash": get_password_hash(payload.password),
        "avatar_url": "",
        "skills": [],
        "experience_years": 0,
        "bio": None,
    }

    result = db.table("profiles").insert(new_user).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    token = create_access_token(subject=user_id, role=payload.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": payload.name,
            "email": payload.email,
            "role": payload.role,
            "avatar": "",
        },
    }


@router.get("/me")
def get_current_user(token: str):
    from app.core.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = _get_db()
    user_id = payload.get("sub", "")
    result = db.table("profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        return {"status": "authenticated", "payload": payload}

    user = result.data[0]
    return {
        "status": "authenticated",
        "user": {
            "id": user["id"],
            "name": user.get("name", ""),
            "email": user["email"],
            "role": user.get("role", "candidate"),
            "avatar": user.get("avatar_url", ""),
        },
    }
