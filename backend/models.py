from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(20), nullable=False, default="user")

    items = relationship("Item", back_populates="owner")

class Item(Base):
    __tablename__ = "items"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    price       = Column(Float, nullable=False)
    owner_id    = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="items")
