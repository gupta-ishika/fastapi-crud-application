# Items API — FastAPI + MySQL

A dead-simple REST API for managing items.

## Setup

1. **Create MySQL database**
   ```sql
   CREATE DATABASE fastapi_crud;
   ```

2. **Update `.env`** with your MySQL credentials:
   ```
   DB_URL=mysql+pymysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/fastapi_crud
   ```

3. **Install dependencies & run**
   ```bash
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Swagger UI**: http://localhost:8000/docs

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/items` | List all items |
| GET | `/items/{id}` | Get single item |
| POST | `/items` | Create item |
| PUT | `/items/{id}` | Update item |
| DELETE | `/items/{id}` | Delete item |
