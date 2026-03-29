# FastAPI CRUD Project — Line-by-Line Code Explanation

---

## Table of Contents

1. [.env](#1-env)
2. [requirements.txt](#2-requirementstxt)
3. [database.py](#3-databasepy)
4. [models.py](#4-modelspy)
5. [schemas.py](#5-schemaspy)
6. [crud.py](#6-crudpy)
7. [routers/items.py](#7-routersitemspy)
8. [main.py](#8-mainpy)
9. [How Everything Connects](#9-how-everything-connects)

---

## 1. `.env`

This file stores **secret configuration** outside your code. Never commit this to GitHub.

```env
DB_URL=mysql+pymysql://root:password@localhost:3306/fastapi_crud
```

| Part | Meaning |
|------|---------|
| `DB_URL` | The variable name your code will look up |
| `mysql+pymysql` | Use MySQL database with the pymysql driver |
| `root` | Your MySQL username |
| `password` | Your MySQL password |
| `localhost` | MySQL is running on this same machine |
| `3306` | Default MySQL port number |
| `fastapi_crud` | The name of your database |

**Why a separate file?** If you hardcode the password in your Python file and push to GitHub, anyone can see it. With `.env`, the secret stays on your machine only.

---

## 2. `requirements.txt`

This is a **shopping list** of Python libraries. Run `pip install -r requirements.txt` to install all of them at once.

```txt
fastapi
uvicorn[standard]
sqlalchemy
pymysql
python-dotenv
```

**Line 1 — `fastapi`**
The main web framework. 

**Line 2 — `uvicorn[standard]`**
The web server that actually runs your FastAPI app.  You run your app with: `uvicorn main:app --reload`. The `[standard]` part installs extra features like auto-reload on file changes.

**Line 3 — `sqlalchemy`**
ORM = Object Relational Mapper. Instead of writing raw SQL like `SELECT * FROM items`, you write Python like `db.query(Item).all()`. SQLAlchemy translates your Python into SQL automatically.

**Line 4 — `pymysql`**
The actual low-level MySQL connector. SQLAlchemy uses this behind the scenes to physically talk to MySQL. You never call it directly — SQLAlchemy handles it.

**Line 5 — `python-dotenv`**
Reads your `.env` file and loads its variables into the environment so Python's `os.getenv()` can find them.

---

## 3. `database.py`

This file sets up the **connection to MySQL** and creates tools other files will use.

```python
from sqlalchemy import create_engine
```
**Line 1:** Creates the actual connection to your MySQL database.

---

```python
from sqlalchemy.ext.declarative import declarative_base
```
**Line 2:** Import `declarative_base` — a factory function that creates a special `Base` class. All your database table classes (models) will inherit from this `Base`. SQLAlchemy uses `Base` to know which Python classes should become database tables.

---

```python
from sqlalchemy.orm import sessionmaker
```
**Line 3:** Import `sessionmaker` — a factory for creating **database sessions**. A session is a temporary conversation with the database. You open one, do your DB operations, then close it. Every HTTP request gets its own fresh session.

---

```python
from dotenv import load_dotenv
```
**Line 4:** Import `load_dotenv` — the function that reads your `.env` file and makes its variables available to Python.

---

```python
import os
```
**Line 5:** Import Python's built-in `os` module. We use it to read environment variables with `os.getenv()`.

---

```python
load_dotenv()
```
**Line 7:** Actually call `load_dotenv()` to read the `.env` file **right now**. This must happen BEFORE you try to read any environment variables, otherwise `os.getenv("DB_URL")` returns `None` and the app crashes.

---

```python
DB_URL = os.getenv("DB_URL")
```
**Line 9:** Read the `DB_URL` value from the environment (which was just loaded from `.env`) and store it in the variable `DB_URL`. This gives us the full connection string like `mysql+pymysql://root:password@localhost:3306/fastapi_crud`.

---

```python
engine = create_engine(DB_URL)
```
**Line 11:** Create the database engine using the connection string. The engine manages a **connection pool** — a set of ready-to-use connections to MySQL. This engine is created once and shared across all requests. It's like setting up a phone line to MySQL that stays open.

---

```python
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```
**Line 12:** Create a **session factory**. This is not a session itself — it's a class that creates sessions on demand. The arguments:
- `autocommit=False` — You must manually call `db.commit()` to save changes. Prevents accidental writes.
- `autoflush=False` — SQLAlchemy won't automatically sync your Python changes to the DB mid-session. You control when that happens.
- `bind=engine` — Sessions created by this factory will use the engine we just made.

---

```python
Base = declarative_base()
```
**Line 13:** Create the `Base` class. Every model (Item, User, etc.) will inherit from this. When you later call `Base.metadata.create_all()`, SQLAlchemy scans all classes that inherit from `Base` and creates the missing tables in MySQL.

---

```python
# Dependency: get a DB session for each request
def get_db():
```
**Lines 15-16:** Define a function called `get_db`. This is a FastAPI **dependency** — FastAPI will call this automatically for every route that needs a database session.

---

```python
    db = SessionLocal()
```
**Line 17:** Create a new database session for this request. Every request gets its own isolated session so they don't interfere with each other.

---

```python
    try:
        yield db
```
**Lines 18-19:** `yield` is the key here. Instead of `return`, we `yield` — this means:
1. The function pauses here
2. `db` is handed to the route function that needs it
3. The route does its work
4. Control comes back to `get_db` after the route finishes
5. The `finally` block runs no matter what (even if there was an error)

This pattern is called a **generator**. It guarantees cleanup always happens.

---

```python
    finally:
        db.close()
```
**Lines 20-21:** Always close the session after the request finishes — whether it succeeded or crashed. This releases the connection back to the pool. Without this, you'd eventually run out of database connections.

---

## 4. `models.py`

This file defines **what your database table looks like** using Python classes.

```python
from sqlalchemy import Column, Integer, String, Float
```
**Line 1:** Import the building blocks for defining table columns:
- `Column` — marks a class attribute as a database column
- `Integer` — whole numbers (1, 2, 3...)
- `String` — text with a max length
- `Float` — decimal numbers (9.99, 14.5...)

---

```python
from database import Base
```
**Line 2:** Import `Base` from our `database.py` file. Our `Item` class will inherit from this so SQLAlchemy knows it's a database table.

---

```python
class Item(Base):
```
**Line 4:** Define a class called `Item` that inherits from `Base`. The inheritance is what tells SQLAlchemy "this Python class = a database table". Without inheriting from `Base`, it's just a plain Python class.

---

```python
    __tablename__ = "items"
```
**Line 5:** Tell SQLAlchemy what to name the table in MySQL. The actual MySQL table will be called `items`. If you leave this out, SQLAlchemy won't know what to name the table.

---

```python
    id = Column(Integer, primary_key=True, index=True)
```
**Line 7:** The `id` column:
- `Integer` — stores whole numbers
- `primary_key=True` — this is the unique identifier for each row. MySQL auto-increments this (1, 2, 3...) — you never set it manually
- `index=True` — creates a database index on this column, making lookups by id much faster

---

```python
    name = Column(String(100), nullable=False)
```
**Line 8:** The `name` column:
- `String(100)` — text up to 100 characters
- `nullable=False` — this field is **required**. If you try to insert a row without a name, MySQL will reject it

---

```python
    description = Column(String(255), nullable=True)
```
**Line 9:** The `description` column:
- `String(255)` — text up to 255 characters
- `nullable=True` — this field is **optional**. A row can exist with no description (stored as NULL in MySQL)

---

```python
    price = Column(Float, nullable=False)
```
**Line 10:** The `price` column:
- `Float` — decimal numbers like 9.99 or 149.50
- `nullable=False` — price is required, can't be empty

---

## 5. `schemas.py`

Schemas define the **shape of data going in and out of your API**. These are NOT database tables — they're just validation rules using Pydantic.

```python
from pydantic import BaseModel
```
**Line 1:** Import `BaseModel` from Pydantic. All schema classes inherit from this. Pydantic automatically validates data types when a schema is used — if someone sends `price: "hello"` instead of a number, it rejects it instantly.

---

```python
from typing import Optional
```
**Line 2:** Import `Optional` from Python's typing module. `Optional[str]` means "either a string or None" — used for fields that aren't required.

---

```python
class ItemCreate(BaseModel):
```
**Line 4:** Schema for **creating** a new item. This is what the user sends in the request body when calling `POST /items/`.

---

```python
    name: str
```
**Line 5:** `name` must be a string. Required — if missing, Pydantic rejects the request automatically.

---

```python
    description: Optional[str] = None
```
**Line 6:** `description` is optional. If the user doesn't send it, it defaults to `None`. `Optional[str]` means it can be a string or nothing.

---

```python
    price: float
```
**Line 7:** `price` must be a float (decimal number). Required.

> **Note:** There's no `id` field here — the database assigns the id automatically. The user should never send an id when creating.

---

```python
class ItemUpdate(BaseModel):
```
**Line 9:** Schema for **updating** an existing item. Used when calling `PUT /items/{id}`. Every field is optional here because the user might only want to change one thing (just the price, for example).

---

```python
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
```
**Lines 10-12:** All fields are optional. If the user only sends `{"price": 99}`, only the price updates — name and description stay unchanged. This is called a **partial update**.

---

```python
class ItemResponse(BaseModel):
```
**Line 14:** Schema for what the API **sends back** to the user. This is used as `response_model` in the routes.

---

```python
    id: int
    name: str
    description: Optional[str] = None
    price: float
```
**Lines 15-18:** The response includes `id` (which the DB assigned) plus all the item fields. FastAPI automatically filters the database object through this schema before sending — so if your DB model had a `password` field, it wouldn't leak into the response unless you included it here.

---

```python
    class Config:
        from_attributes = True
```
**Lines 20-21:** This inner `Config` class tells Pydantic: "When reading data, also accept SQLAlchemy model objects — not just plain dictionaries." Without this, returning a database object (`db_item`) to a Pydantic schema would crash, because Pydantic expects a dict. With `from_attributes = True`, Pydantic reads `.id`, `.name`, `.price` etc. directly from the SQLAlchemy object's attributes.

---

## 6. `crud.py`

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete. This file contains all the actual database operations. It's kept separate from routes to keep things organized and testable.

```python
from sqlalchemy.orm import Session
```
**Line 1:** Import the `Session` type for type hints. This is just for code clarity — it tells other developers (and your IDE) that the `db` parameter is a database session.

---

```python
import models, schemas
```
**Line 2:** Import our `models.py` and `schemas.py` files. We need models to query the database, and schemas to validate input data.

---

### `get_items` function

```python
def get_items(db: Session):
```
**Line 4:** Define a function that takes a database session as input. The `: Session` is a type hint — it doesn't enforce anything, just helps your IDE understand what `db` is.

---

```python
    return db.query(models.Item).all()
```
**Line 5:** This is one line but does a lot:
- `db.query(models.Item)` — start a query on the `items` table (via the `Item` model). Equivalent to `SELECT * FROM items` in SQL.
- `.all()` — execute the query and return ALL results as a Python list.

---

### `get_item` function

```python
def get_item(db: Session, item_id: int):
```
**Line 7:** Takes a session and the id of the item we want. `item_id: int` means it must be a whole number.

---

```python
    return db.query(models.Item).filter(models.Item.id == item_id).first()
```
**Line 8:** Chain of operations:
- `db.query(models.Item)` — query the items table
- `.filter(models.Item.id == item_id)` — add a WHERE clause: `WHERE id = item_id`
- `.first()` — return the first (and only) matching result, or `None` if not found

Equivalent SQL: `SELECT * FROM items WHERE id = ? LIMIT 1`

---

### `create_item` function

```python
def create_item(db: Session, item: schemas.ItemCreate):
```
**Line 10:** Takes a session and an `ItemCreate` schema object (already validated by Pydantic).

---

```python
    db_item = models.Item(**item.model_dump())
```
**Line 11:** Two things happen here:
- `item.model_dump()` — converts the Pydantic schema object into a plain Python dictionary: `{"name": "Laptop", "description": None, "price": 999.0}`
- `**item.model_dump()` — the `**` unpacks the dict as keyword arguments
- `models.Item(...)` — creates a new SQLAlchemy Item object with those values

So this creates a new `Item` object in Python memory, but nothing is in the database yet.

---

```python
    db.add(db_item)
```
**Line 12:** Tell the database session "I want to insert this item." This **stages** the insert — like putting something in a shopping cart. It's not in the database yet.

---

```python
    db.commit()
```
**Line 13:** **Actually save** to the database. This is when the `INSERT INTO items ...` SQL runs. If something goes wrong here (e.g. database is down), an exception is raised and nothing is saved.

---

```python
    db.refresh(db_item)
```
**Line 14:** Re-read the `db_item` from the database. Why? Because after inserting, MySQL assigned an auto-generated `id` to the row. But our Python object `db_item` doesn't know what that id is yet. `refresh()` syncs the Python object with the database, so now `db_item.id` has the real value (e.g. 7).

---

```python
    return db_item
```
**Line 15:** Return the item with all its fields including the newly assigned `id`.

---

### `update_item` function

```python
def update_item(db: Session, item_id: int, item: schemas.ItemUpdate):
```
**Line 17:** Takes a session, the id of the item to update, and the update data (all fields optional).

---

```python
    db_item = get_item(db, item_id)
```
**Line 18:** Reuse the `get_item` function to find the existing item. If it doesn't exist, this returns `None`.

---

```python
    if not db_item:
        return None
```
**Lines 19-20:** If the item wasn't found (`db_item` is `None`), return `None`. The router will then raise a 404 error.

---

```python
    for key, value in item.model_dump(exclude_unset=True).items():
```
**Line 21:** This is the smart part of partial updates:
- `item.model_dump(exclude_unset=True)` — converts the update schema to a dict, but ONLY includes fields the user actually sent. If the user only sent `{"price": 99}`, this gives `{"price": 99}` — NOT `{"name": None, "description": None, "price": 99}`.
- `.items()` — turns the dict into `(key, value)` pairs: `[("price", 99)]`
- `for key, value in ...` — loop through each field to update

---

```python
        setattr(db_item, key, value)
```
**Line 22:** `setattr` dynamically sets an attribute on an object. This is equivalent to `db_item.price = 99`. Using `setattr` lets us update any field by name without writing `if "price" in data: db_item.price = data["price"]` for every single field.

---

```python
    db.commit()
    db.refresh(db_item)
    return db_item
```
**Lines 23-25:** Same pattern as create — commit to save, refresh to sync, return the updated item.

---

### `delete_item` function

```python
def delete_item(db: Session, item_id: int):
```
**Line 27:** Takes a session and the id of the item to delete.

---

```python
    db_item = get_item(db, item_id)
    if not db_item:
        return None
```
**Lines 28-30:** Find the item first. If it doesn't exist, return `None` (router raises 404).

---

```python
    db.delete(db_item)
```
**Line 31:** Tell the session "delete this item." Stages the deletion.

---

```python
    db.commit()
```
**Line 32:** Execute the `DELETE FROM items WHERE id = ?` SQL. The row is now gone from the database.

---

```python
    return db_item
```
**Line 33:** Return the deleted item (its data). This is useful so the caller can confirm what was deleted. (The object still exists in Python memory even though it's deleted from the DB.)

---

## 7. `routers/items.py`

This file defines the **5 REST API endpoints**. It's the layer between HTTP requests and your CRUD functions.

```python
from fastapi import APIRouter, Depends, HTTPException
```
**Line 1:**
- `APIRouter` — like a mini FastAPI app. Groups related routes together. Gets registered in `main.py`.
- `Depends` — FastAPI's dependency injection system. Used to automatically get a DB session.
- `HTTPException` — raise this to send HTTP error responses (like 404 Not Found).

---

```python
from sqlalchemy.orm import Session
```
**Line 2:** Import `Session` type hint for the `db` parameter.

---


```python
from typing import List
```
**Line 5:** Import `List` for type hints. `List[schemas.ItemResponse]` means "a list of ItemResponse objects."

---

```python
router = APIRouter(prefix="/items", tags=["Items"])
```
**Line 7:**
- Create the router object
- `prefix="/items"` — all routes in this file automatically start with `/items`. 
- `tags=["Items"]` — groups these endpoints under "Items" in the `/docs` Swagger UI.

---

### GET all items

```python
@router.get("/", response_model=List[schemas.ItemResponse])
def get_items(db: Session = Depends(get_db)):
```
**Lines 9-10:**
- `@router.get("/")` — this function handles `GET /items/` requests
- `response_model=List[schemas.ItemResponse]` — FastAPI will validate and filter the response through this schema automatically
- `db: Session = Depends(get_db)` — FastAPI sees `Depends(get_db)`, calls `get_db()`, gets a session, injects it as `db`. You never call `get_db()` yourself.

---

```python
    return crud.get_items(db)
```
**Line 11:** Call our CRUD function and return the result. FastAPI automatically converts the list of SQLAlchemy objects to JSON using `ItemResponse`.

---

### GET single item

```python
@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
```
**Lines 13-14:**
- `"/{item_id}"` — `{item_id}` is a **path parameter**. If someone calls `/items/5`, then `item_id = 5`.
- `item_id: int` — FastAPI automatically converts the URL string "5" to the integer `5`.

---

```python
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```
**Lines 15-18:**
- Call `get_item` — returns the item or `None`
- `if not item` — if the result is `None`, the item doesn't exist
- `raise HTTPException(status_code=404, ...)` — send a 404 Not Found response with a clear message. `raise` stops execution immediately — the `return item` line never runs if the item wasn't found.
- `return item` — if found, return it (FastAPI converts to JSON)

---

### POST create item

```python
@router.post("/", response_model=schemas.ItemResponse, status_code=201)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
```
**Lines 20-21:**
- `@router.post("/")` — handles `POST /items/` requests
- `status_code=201` — return HTTP 201 Created instead of 200 OK. 201 specifically means "resource was created successfully" — more semantically correct.
- `item: schemas.ItemCreate` — FastAPI reads the JSON body and validates it against `ItemCreate`. If validation fails (missing name, wrong type), FastAPI auto-returns a 422 error.

---

```python
    return crud.create_item(db, item)
```
**Line 22:** Create the item and return it. Simple!

---

### PUT update item

```python
@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
```
**Lines 24-25:** Takes the item id from the URL AND the update data from the request body.

---

```python
    updated = crud.update_item(db, item_id, item)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated
```
**Lines 26-29:** Same pattern as GET single item — try the operation, raise 404 if it returns None.

---

### DELETE item

```python
@router.delete("/{item_id}", response_model=schemas.ItemResponse)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return deleted
```
**Lines 31-36:** Same pattern. Returns the deleted item in the response (so the frontend knows what was removed).

---

## 8. `main.py`

The **entry point** of the entire application. This is where everything comes together.

```python
from fastapi import FastAPI
```
**Line 1:** Import the main FastAPI class.

---

```python
from fastapi.middleware.cors import CORSMiddleware
```
**Line 2:** Import CORS middleware. CORS (Cross-Origin Resource Sharing) is a browser security rule. By default, browsers block JavaScript from making requests to a different port/domain. Your React app on port 5173 can't talk to your API on port 8000 without this.

---

```python
from database import engine, Base
```
**Line 3:** Import the engine (DB connection) and Base (parent of all models). We need these to create tables on startup.

---

```python
from routers import items
```
**Line 4:** Import the items router so we can register its routes with the main app.

---

```python
Base.metadata.create_all(bind=engine)
```
**Line 7:** This runs on startup. SQLAlchemy looks at all classes that inherit from `Base` (like `Item`) and creates the corresponding tables in MySQL **if they don't already exist**. It's safe to run every time — it skips tables that already exist.

---

```python
app = FastAPI(title="Items API")
```
**Line 9:** Create the main FastAPI application object. `title="Items API"` sets the name shown in the auto-generated `/docs` Swagger UI. Visit `http://localhost:8000/docs` to test all your endpoints visually.

---

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
**Lines 12-17:**
- `allow_origins=["http://localhost:5173"]` — only allow requests from the React dev server. In production, you'd replace this with your actual domain.
- `allow_methods=["*"]` — allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
- `allow_headers=["*"]` — allow all request headers (Content-Type, Authorization, etc.)

Without this, your React app would get a "CORS error" in the browser and no requests would work.

---

```python
app.include_router(items.router)
```
**Line 19:** Register all the routes from `routers/items.py` with the main app. The prefix `/items` was already defined in the router, so all 5 endpoints are now accessible. If you add more routers (users, orders), you include them here.

---

```python
@app.get("/")
def root():
    return {"message": "Items API is running. Visit /docs for Swagger UI."}
```
**Lines 21-23:** A simple health-check route. Visiting `http://localhost:8000/` returns a JSON message. Useful to confirm the server is running.

---

## 9. How Everything Connects

Here's the journey of a single request — `POST /items/` with `{"name": "Laptop", "price": 999}`:

```
React frontend
  └── axios.post("http://localhost:8000/items/", {name:"Laptop", price:999})
        │
        ▼
main.py (CORS check passes)
        │
        ▼
routers/items.py — @router.post("/")
  ├── FastAPI validates body against ItemCreate schema ✓
  ├── FastAPI calls get_db() → opens DB session
  └── calls crud.create_item(db, item)
        │
        ▼
crud.py — create_item()
  ├── Item(**item.model_dump()) → creates Python Item object
  ├── db.add(db_item)           → stages the INSERT
  ├── db.commit()               → writes to MySQL
  ├── db.refresh(db_item)       → reads back the auto-generated id
  └── returns db_item (now has id=7)
        │
        ▼
routers/items.py
  └── FastAPI filters db_item through ItemResponse schema
        │
        ▼
HTTP Response: 201 Created
{"id": 7, "name": "Laptop", "description": null, "price": 999.0}
        │
        ▼
React frontend receives the new item with its id
```

### The 3 most important concepts to remember

**1. Models vs Schemas**
- `models.py` → defines the **database table** (SQLAlchemy)
- `schemas.py` → defines the **API data shape** (Pydantic)
- They look similar but serve completely different purposes

**2. The commit pattern**
```python
db.add(item)      # Stage
db.commit()       # Save to DB
db.refresh(item)  # Sync back (get auto-generated id)
```

**3. Depends(get_db)**
```python
def my_route(db: Session = Depends(get_db)):
```
FastAPI automatically calls `get_db()`, gives you a session, and closes it after. You never manage the session lifecycle yourself.

---

*To run the app:*
```bash
cd backend
uvicorn main:app --reload
# Visit http://localhost:8000/docs to test all endpoints
```