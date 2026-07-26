from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.auth import UserLoginRequest, UserRegisterRequest, TokenResponse
from app.core.security import create_access_token, get_password_hash, verify_password, decode_access_token

router = APIRouter()

# Mock users database
MOCK_USERS_DB = {
    "alex.rivera@example.com": {
        "id": "cand-101",
        "email": "alex.rivera@example.com",
        "name": "Alex Rivera",
        "role": "candidate",
        "password_hash": get_password_hash("password123"),
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    "recruiter@lineardev.com": {
        "id": "rec-202",
        "email": "recruiter@lineardev.com",
        "name": "Sarah Jenkins",
        "role": "recruiter",
        "password_hash": get_password_hash("recruiter123"),
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
    }
}

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest):
    user = MOCK_USERS_DB.get(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(subject=user["id"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "avatar": user["avatar"]
        }
    }

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest):
    if payload.email in MOCK_USERS_DB:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    new_user = {
        "id": f"user-{len(MOCK_USERS_DB) + 101}",
        "email": payload.email,
        "name": payload.name,
        "role": payload.role,
        "password_hash": get_password_hash(payload.password),
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    }
    MOCK_USERS_DB[payload.email] = new_user
    
    token = create_access_token(subject=new_user["id"], role=new_user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "role": new_user["role"],
            "avatar": new_user["avatar"]
        }
    }

@router.get("/me")
def get_current_user(token: str):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"status": "authenticated", "payload": payload}
