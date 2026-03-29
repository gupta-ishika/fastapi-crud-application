from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import crud, schemas, models
from routers.auth import get_current_user

router = APIRouter(prefix="/items", tags=["Items"])

@router.get("/", response_model=List[schemas.ItemResponse])
def get_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_items(db, owner_id=current_user.id)

@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this item")
    return item

@router.post("/", response_model=schemas.ItemResponse, status_code=201)
def create_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_item(db, item, owner_id=current_user.id)

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: int,
    item: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = crud.get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")
    updated = crud.update_item(db, item_id, item)
    return updated

@router.delete("/{item_id}", response_model=schemas.ItemResponse)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = crud.get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if db_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    deleted = crud.delete_item(db, item_id)
    return deleted
