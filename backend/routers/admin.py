from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import crud, schemas, models
from routers.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[schemas.UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Return all registered users. Admin only."""
    return crud.get_all_users(db)

@router.delete("/users/{user_id}", response_model=schemas.UserResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    """Delete a user by ID. Admin only."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    deleted = crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return deleted
