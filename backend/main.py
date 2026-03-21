from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import items

# Create all tables in the database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Items API")

# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)

@app.get("/")
def root():
    return {"message": "Items API is running. Visit /docs for Swagger UI."}
