from pydantic import BaseModel, Field
from typing import Optional

# ── Items ────────────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    name:        str   = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    price:       float = Field(..., gt=0)

class ItemUpdate(BaseModel):
    name:        Optional[str]   = Field(None, min_length=1, max_length=100)
    description: Optional[str]   = Field(None, max_length=255)
    price:       Optional[float] = Field(None, gt=0)

class ItemResponse(BaseModel):
    id:          int
    name:        str
    description: Optional[str] = None
    price:       float
    owner_id:    Optional[int] = None

    class Config:
        from_attributes = True

# ── Users ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role:     str = Field(default="user", pattern="^(user|admin)$")

class UserResponse(BaseModel):
    id:       int
    username: str
    role:     str

    class Config:
        from_attributes = True

# ── Auth tokens ───────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type:   str

class TokenData(BaseModel):
    username: Optional[str] = None
