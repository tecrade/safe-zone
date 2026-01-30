from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./safezone.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_volunteer = Column(Boolean, default=False)
    volunteer_type = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=False) # Tracks if user is currently logged in/online
    created_at = Column(DateTime, default=datetime.utcnow)

    emergency_requests_made = relationship("EmergencyRequest", foreign_keys="EmergencyRequest.requester_id", back_populates="requester")
    emergency_requests_responded = relationship("EmergencyRequest", foreign_keys="EmergencyRequest.responder_id", back_populates="responder")

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="pending")
    requester_lat = Column(Float, nullable=False)
    requester_lon = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="emergency_requests_made")
    responder = relationship("User", foreign_keys=[responder_id], back_populates="emergency_requests_responded")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
