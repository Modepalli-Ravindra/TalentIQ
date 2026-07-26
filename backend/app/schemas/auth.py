from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "candidate" # "candidate" | "recruiter" | "admin"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
