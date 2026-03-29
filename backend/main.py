from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import items, auth, admin

# Create all tables in the database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Items API",
    version="1.0.0",
    description="A FastAPI CRUD application with JWT authentication and role-based access.",
)

# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes versioned under /api/v1
app.include_router(auth.router,  prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Items API v1 is running. Visit /docs for Swagger UI."}
