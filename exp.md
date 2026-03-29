# FastAPI CRUD — Code Explained


## 1. `.env`

```env
DB_URL=mysql+pymysql://root:password@localhost:3306/fastapi_crud
```

- This file stores secrets like your database password outside your code
- `mysql+pymysql` → use MySQL with pymysql as the driver
- `root:password` → your MySQL username and password
- `localhost:3306` → MySQL is running on your machine at port 3306
- `fastapi_crud` → the database name

---

## 2. `requirements.txt`

```txt
fastapi             # the web framework — handles routing, requests, responses
uvicorn[standard]   # the server that runs your FastAPI app
sqlalchemy          # lets you write Python instead of SQL to talk to the database
pymysql             # the actual MySQL connector, used by SQLAlchemy internally
python-dotenv       # reads your .env file
```

Run `pip install -r requirements.txt` to install all of them at once.

---

## 3. `database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()  # reads .env file and loads DB_URL into memory — must run before os.getenv()

DB_URL = os.getenv("DB_URL")  # fetches the DB_URL value we defined in .env

engine = create_engine(DB_URL)  # opens a connection to MySQL using that URL

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# SessionLocal is a factory that creates DB sessions
# autocommit=False → you must call db.commit() manually to save changes
# bind=engine → sessions created here will use the MySQL connection above

Base = declarative_base()
# Base is the parent class for all your models (tables)
# any class that inherits from Base becomes a database table

def get_db():
    db = SessionLocal()    # open a new session for this request
    try:
        yield db           # hand the session to the route function
    finally:
        db.close()         # always close the session after the request, even if it crashed
```

- `yield` is used instead of `return` so that the `finally` block always runs — this guarantees the session is closed and the database connection is freed no matter what

---

## 4. `models.py`

```python
from sqlalchemy import Column, Integer, String, Float
from database import Base  # import Base so Item can inherit from it

class Item(Base):
    __tablename__ = "items"  # the actual table name in MySQL

    id          = Column(Integer, primary_key=True, index=True)
    # primary_key=True → MySQL auto-assigns 1, 2, 3... you never set this manually
    # index=True → makes lookups by id faster

    name        = Column(String(100), nullable=False)   # required, max 100 chars
    description = Column(String(255), nullable=True)    # optional, can be empty
    price       = Column(Float, nullable=False)         # required, decimal number
```

- This Python class is your database table — SQLAlchemy reads it and creates the `items` table in MySQL
- `nullable=False` means required, `nullable=True` means optional

---

## 5. `schemas.py`

```python
from pydantic import BaseModel
from typing import Optional

class ItemCreate(BaseModel):  # used when user CREATES an item (POST)
    name: str
    description: Optional[str] = None  # optional field
    price: float
    # no id here — MySQL assigns it automatically

class ItemUpdate(BaseModel):  # used when user EDITS an item (PUT)
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    # all fields optional — user might only want to update price, not name

class ItemResponse(BaseModel):  # used when sending data BACK to the user
    id: int        # now we include id because the DB has assigned one
    name: str
    description: Optional[str] = None
    price: float

    class Config:
        from_attributes = True
        # tells Pydantic it can read data from SQLAlchemy objects
        # without this, returning a DB object would crash
```

- Schemas are NOT database tables — they just define the shape of data coming in and going out of the API
- Pydantic validates automatically — if someone sends `price: "hello"` instead of a number, it rejects the request with a clear error, you don't write any validation code yourself

---

## 6. `crud.py`

```python
from sqlalchemy.orm import Session
import models, schemas

def get_items(db: Session):
    return db.query(models.Item).all()
    # db.query(Item) → SELECT * FROM items
    # .all() → return all rows as a Python list

def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()
    # .filter(...) → WHERE id = item_id
    # .first() → return the first match, or None if not found

def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.model_dump())
    # item.model_dump() converts Pydantic object → plain dict {"name": "Laptop", "price": 999}
    # ** unpacks that dict as arguments to Item()

    db.add(db_item)     # stage the INSERT — not saved yet
    db.commit()         # actually write to MySQL
    db.refresh(db_item) # re-read from DB so db_item now has the auto-generated id
    return db_item

def update_item(db: Session, item_id: int, item: schemas.ItemUpdate):
    db_item = get_item(db, item_id)
    if not db_item:
        return None  # item doesn't exist, router will raise 404

    for key, value in item.model_dump(exclude_unset=True).items():
        # exclude_unset=True → only includes fields the user actually sent
        # so if user sent {"price": 99}, only price updates — name stays unchanged
        setattr(db_item, key, value)  # same as db_item.price = 99

    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int):
    db_item = get_item(db, item_id)
    if not db_item:
        return None  # item doesn't exist, router will raise 404

    db.delete(db_item)  # stage the DELETE
    db.commit()         # remove from MySQL
    return db_item      # return deleted item so caller knows what was removed
```

- Every write operation follows the same 3-step pattern: `db.add/delete` → `db.commit()` → `db.refresh()`

---

## 7. `routers/items.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud, schemas
from typing import List

router = APIRouter(prefix="/items", tags=["Items"])
# prefix="/items" → all routes here start with /items automatically
# tags=["Items"] → groups them under "Items" in the /docs page

@router.get("/", response_model=List[schemas.ItemResponse])
def get_items(db: Session = Depends(get_db)):
    # Depends(get_db) → FastAPI automatically calls get_db(), gets a session, injects it as db
    return crud.get_items(db)

@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    # {item_id} in the URL is a path parameter — /items/5 gives item_id=5
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/", response_model=schemas.ItemResponse, status_code=201)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    # FastAPI reads the JSON body and validates it against ItemCreate automatically
    # status_code=201 → "Created" is more correct than 200 "OK" for creation
    return crud.create_item(db, item)

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    updated = crud.update_item(db, item_id, item)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated

@router.delete("/{item_id}", response_model=schemas.ItemResponse)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return deleted
```

- `response_model` filters what gets sent back — if your DB object has a password field it won't leak into the response unless you add it to the schema
- `raise HTTPException` stops the function immediately and sends an error response

---

## 8. `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import items

Base.metadata.create_all(bind=engine)
# runs on startup — looks at all models that inherit from Base
# and creates their tables in MySQL if they don't exist yet
# safe to run every time — skips tables that already exist

app = FastAPI(title="Items API")  # creates the main app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # allow requests from React dev server
    allow_methods=["*"],   # allow GET, POST, PUT, DELETE etc.
    allow_headers=["*"],   # allow all headers
)
# browsers block JS from calling APIs on a different port by default
# your React app is on port 5173, API is on 8000 — without this, every call fails

app.include_router(items.router)
# registers all /items/ routes into the main app
# add more routers here as your app grows (users, orders, etc.)

@app.get("/")
def root():
    return {"message": "Items API is running. Visit /docs for Swagger UI."}
```

---

## Run the app

```bash
cd backend
uvicorn main:app --reload
```

Open `http://localhost:8000/docs` to test all endpoints in the browser.