from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import math

from database import get_db, init_db, User, EmergencyRequest
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from crime_data import generate_crime_density_data, get_risk_level_at_location

app = FastAPI(title="SafeZone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic models
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class VolunteerRegister(BaseModel):
    volunteer_type: str

class AvailabilityUpdate(BaseModel):
    is_available: bool

class EmergencyAccept(BaseModel):
    request_id: int

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    latitude: Optional[float]
    longitude: Optional[float]
    is_volunteer: bool
    volunteer_type: Optional[str]
    is_available: bool

    class Config:
        from_attributes = True

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371e3
    φ1 = math.radians(lat1)
    φ2 = math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)
    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# AUTH ENDPOINTS
@app.post("/api/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(request.password)
    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user)
    }

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

# LOCATION ENDPOINTS
@app.post("/api/location/update")
def update_location(
    location: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.latitude = location.latitude
    current_user.longitude = location.longitude
    current_user.last_updated = datetime.utcnow()
    db.commit()
    
    # Requested feature: Print coords stored in variable
    print(f"User Location Updated: Lat={location.latitude}, Lon={location.longitude}")
    
    return {"message": "Location updated successfully"}

@app.get("/api/location/nearby")
def get_nearby_users(
    lat: float,
    lon: float,
    radius: float = 5000,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    volunteers = db.query(User).filter(
        User.is_volunteer == True,
        User.is_available == True,
        User.latitude.isnot(None),
        User.longitude.isnot(None),
        User.id != current_user.id
    ).all()
    
    nearby_volunteers = []
    for volunteer in volunteers:
        distance = calculate_distance(lat, lon, volunteer.latitude, volunteer.longitude)
        if distance <= radius:
            nearby_volunteers.append({
                "id": volunteer.id,
                "name": volunteer.name,
                "volunteer_type": volunteer.volunteer_type,
                "latitude": volunteer.latitude,
                "longitude": volunteer.longitude,
                "distance": round(distance)
            })
    
    nearby_volunteers.sort(key=lambda x: x['distance'])
    return {"volunteers": nearby_volunteers}

# VOLUNTEER ENDPOINTS
@app.post("/api/volunteer/register")
def register_volunteer(
    request: VolunteerRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.is_volunteer = True
    current_user.volunteer_type = request.volunteer_type
    current_user.is_available = True
    db.commit()
    return {"message": "Registered as volunteer successfully"}

@app.put("/api/volunteer/availability")
def update_availability(
    request: AvailabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_volunteer:
        raise HTTPException(status_code=400, detail="User is not a volunteer")
    
    current_user.is_available = request.is_available
    db.commit()
    return {"message": "Availability updated successfully"}

# EMERGENCY ENDPOINTS
@app.post("/api/emergency/request")
def create_emergency_request(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.latitude or not current_user.longitude:
        raise HTTPException(status_code=400, detail="Location not available")
    
    active_request = db.query(EmergencyRequest).filter(
        EmergencyRequest.requester_id == current_user.id,
        EmergencyRequest.status.in_(["pending", "accepted"])
    ).first()
    
    if active_request:
        raise HTTPException(status_code=400, detail="You already have an active emergency request")
    
    emergency_request = EmergencyRequest(
        requester_id=current_user.id,
        requester_lat=current_user.latitude,
        requester_lon=current_user.longitude,
        status="pending"
    )
    db.add(emergency_request)
    db.commit()
    db.refresh(emergency_request)
    
    volunteers = db.query(User).filter(
        User.is_volunteer == True,
        User.is_available == True,
        User.latitude.isnot(None),
        User.longitude.isnot(None),
        User.id != current_user.id
    ).all()
    
    nearest_volunteers = []
    for volunteer in volunteers:
        distance = calculate_distance(
            current_user.latitude,
            current_user.longitude,
            volunteer.latitude,
            volunteer.longitude
        )
        nearest_volunteers.append({
            "id": volunteer.id,
            "name": volunteer.name,
            "volunteer_type": volunteer.volunteer_type,
            "distance": round(distance)
        })
    
    nearest_volunteers.sort(key=lambda x: x['distance'])
    
    return {
        "request_id": emergency_request.id,
        "message": "Emergency request created",
        "nearest_volunteers": nearest_volunteers[:5]
    }

@app.post("/api/emergency/accept")
def accept_emergency_request(
    request: EmergencyAccept,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_volunteer:
        raise HTTPException(status_code=400, detail="Only volunteers can accept requests")
    
    emergency_request = db.query(EmergencyRequest).filter(
        EmergencyRequest.id == request.request_id
    ).first()
    
    if not emergency_request:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    if emergency_request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already handled")
    
    emergency_request.status = "accepted"
    emergency_request.responder_id = current_user.id
    db.commit()
    
    return {"message": "Emergency request accepted"}

@app.get("/api/emergency/active")
def get_active_emergencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_volunteer and current_user.latitude and current_user.longitude:
        pending_requests = db.query(EmergencyRequest).filter(
            EmergencyRequest.status == "pending"
        ).all()
        
        nearby_requests = []
        for req in pending_requests:
            distance = calculate_distance(
                current_user.latitude,
                current_user.longitude,
                req.requester_lat,
                req.requester_lon
            )
            if distance <= 5000:
                requester = db.query(User).filter(User.id == req.requester_id).first()
                nearby_requests.append({
                    "request_id": req.id,
                    "requester_name": requester.name,
                    "requester_lat": req.requester_lat,
                    "requester_lon": req.requester_lon,
                    "distance": round(distance),
                    "created_at": req.created_at.isoformat()
                })
        
        nearby_requests.sort(key=lambda x: x['distance'])
        return {"requests": nearby_requests}
    
    user_requests = db.query(EmergencyRequest).filter(
        EmergencyRequest.requester_id == current_user.id,
        EmergencyRequest.status.in_(["pending", "accepted"])
    ).all()
    
    requests_data = []
    for req in user_requests:
        data = {
            "request_id": req.id,
            "status": req.status,
            "created_at": req.created_at.isoformat()
        }
        if req.responder_id:
            responder = db.query(User).filter(User.id == req.responder_id).first()
            data["responder_name"] = responder.name
            data["responder_lat"] = responder.latitude
            data["responder_lon"] = responder.longitude
        requests_data.append(data)
    
    return {"requests": requests_data}

@app.get("/api/emergency/status/{request_id}")
def get_emergency_status(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emergency_request = db.query(EmergencyRequest).filter(
        EmergencyRequest.id == request_id
    ).first()
    
    if not emergency_request:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    if emergency_request.requester_id != current_user.id and emergency_request.responder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
    
    requester = db.query(User).filter(User.id == emergency_request.requester_id).first()
    
    response = {
        "request_id": emergency_request.id,
        "status": emergency_request.status,
        "requester_lat": requester.latitude,
        "requester_lon": requester.longitude,
        "created_at": emergency_request.created_at.isoformat()
    }
    
    if emergency_request.responder_id:
        responder = db.query(User).filter(User.id == emergency_request.responder_id).first()
        response["responder_name"] = responder.name
        response["responder_lat"] = responder.latitude
        response["responder_lon"] = responder.longitude
        response["responder_type"] = responder.volunteer_type
    
    return response

# CRIME DATA ENDPOINTS
@app.get("/api/crime/density")
def get_crime_density(
    lat: float,
    lon: float,
    radius: float = 2000,
    current_user: User = Depends(get_current_user)
):
    crime_data = generate_crime_density_data(lat, lon, radius)
    risk_level = get_risk_level_at_location(lat, lon, crime_data)
    
    return {
        "crime_zones": crime_data,
        "current_risk_level": risk_level
    }

@app.get("/")
def root():
    return {"message": "SafeZone API is running"}
