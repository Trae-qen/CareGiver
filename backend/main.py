from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/caregiver")

# Fix for Railway PostgreSQL URL (uses postgres:// instead of postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    allergies = Column(String)
    emergency_contact = Column(String)
    doctor = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    medications = relationship("Medication", back_populates="patient")
    checkins = relationship("CheckIn", back_populates="patient")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="aide")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    checkins = relationship("CheckIn", back_populates="user")

class CheckIn(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    category = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="checkins")
    patient = relationship("Patient", back_populates="checkins")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    time = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="medications")

# Deprecated - keeping for backward compatibility
class PatientInfo(Base):
    __tablename__ = "patient_info"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    allergies = Column(String)
    emergency_contact = Column(String)
    doctor = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models
class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    allergies: Optional[str] = None
    emergency_contact: Optional[str] = None
    doctor: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]
    allergies: Optional[str]
    emergency_contact: Optional[str]
    doctor: Optional[str]
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: Optional[str] = "aide"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    
    class Config:
        from_attributes = True

class CheckInCreate(BaseModel):
    user_id: Optional[int]
    patient_id: int
    category: str
    data: dict

class CheckInResponse(BaseModel):
    id: int
    category: str
    data: dict
    timestamp: datetime
    user: Optional[UserResponse]
    patient_id: int
    
    class Config:
        from_attributes = True

class MedicationCreate(BaseModel):
    patient_id: int
    name: str
    dosage: str
    frequency: str
    time: str
    active: Optional[bool] = True

class MedicationResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    dosage: str
    frequency: str
    time: str
    active: bool
    
    class Config:
        from_attributes = True

class PatientInfoUpdate(BaseModel):
    name: Optional[str]
    age: Optional[int]
    allergies: Optional[str]
    emergency_contact: Optional[str]
    doctor: Optional[str]

class PatientInfoResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]
    allergies: Optional[str]
    emergency_contact: Optional[str]
    doctor: Optional[str]
    
    class Config:
        from_attributes = True

# FastAPI app
app = FastAPI(title="CareGiver API", version="1.0.0")

# Startup event to create database tables
@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        # Don't crash the app, let it retry on next request

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",   # Vercel deployments (replace * with your app name)
        os.getenv("FRONTEND_URL", "http://localhost:3000")  # Custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "CareGiver API", "version": "1.0.0", "status": "running"}

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/api/auth/login", response_model=UserResponse)
def login(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Auto-create user in demo mode
        name = email.split("@")[0].replace(".", " ").title()
        user = User(email=email, name=name, role="aide")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

@app.get("/api/auth/verify")
def verify_user(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    return {"exists": user is not None}

# User endpoints
@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Patient endpoints
@app.post("/api/patients", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/patients", response_model=List[PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return patients

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, updates: PatientCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient

# Check-in endpoints
@app.post("/api/checkins", response_model=CheckInResponse)
def create_checkin(checkin: CheckInCreate, db: Session = Depends(get_db)):
    db_checkin = CheckIn(**checkin.dict())
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    return db_checkin

@app.get("/api/checkins", response_model=List[CheckInResponse])
def get_checkins(
    date: Optional[str] = None,
    category: Optional[str] = None,
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CheckIn)
    
    if date:
        # Filter by date
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            query = query.filter(
                CheckIn.timestamp >= date_obj,
                CheckIn.timestamp < datetime(date_obj.year, date_obj.month, date_obj.day + 1)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if category:
        query = query.filter(CheckIn.category == category)
    
    if user_id:
        query = query.filter(CheckIn.user_id == user_id)
    
    if patient_id:
        query = query.filter(CheckIn.patient_id == patient_id)
    
    checkins = query.order_by(CheckIn.timestamp.desc()).all()
    return checkins

@app.get("/api/checkins/{checkin_id}", response_model=CheckInResponse)
def get_checkin(checkin_id: int, db: Session = Depends(get_db)):
    checkin = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return checkin

@app.delete("/api/checkins/{checkin_id}")
def delete_checkin(checkin_id: int, db: Session = Depends(get_db)):
    checkin = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    db.delete(checkin)
    db.commit()
    return {"message": "Check-in deleted successfully"}

# Medication endpoints
@app.post("/api/medications", response_model=MedicationResponse)
def create_medication(medication: MedicationCreate, db: Session = Depends(get_db)):
    db_medication = Medication(**medication.dict())
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    return db_medication

@app.get("/api/medications", response_model=List[MedicationResponse])
def get_medications(
    active_only: bool = False,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Medication)
    if active_only:
        query = query.filter(Medication.active == True)
    if patient_id:
        query = query.filter(Medication.patient_id == patient_id)
    medications = query.all()
    return medications

@app.put("/api/medications/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    medication: MedicationCreate,
    db: Session = Depends(get_db)
):
    db_medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    for key, value in medication.dict().items():
        setattr(db_medication, key, value)
    
    db.commit()
    db.refresh(db_medication)
    return db_medication

@app.delete("/api/medications/{medication_id}")
def delete_medication(medication_id: int, db: Session = Depends(get_db)):
    medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(medication)
    db.commit()
    return {"message": "Medication deleted successfully"}

# Patient info endpoints
@app.get("/api/patient", response_model=PatientInfoResponse)
def get_patient_info(db: Session = Depends(get_db)):
    patient = db.query(PatientInfo).first()
    if not patient:
        # Create default patient info
        patient = PatientInfo(
            name="Patient Name",
            age=75,
            allergies="None",
            emergency_contact="",
            doctor=""
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

@app.put("/api/patient", response_model=PatientInfoResponse)
def update_patient_info(patient_info: PatientInfoUpdate, db: Session = Depends(get_db)):
    patient = db.query(PatientInfo).first()
    if not patient:
        patient = PatientInfo()
        db.add(patient)
    
    for key, value in patient_info.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
