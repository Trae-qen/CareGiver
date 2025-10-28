from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
import tempfile
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from typing import Optional, List, Any
import os
from dotenv import load_dotenv
import logging


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

def now_utc():
    return datetime.now(timezone.utc)

# Database Models
class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    allergies = Column(String)
    emergency_contact = Column(String)
    doctor = Column(String)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    
    medications = relationship("Medication", back_populates="patient")
    checkins = relationship("CheckIn", back_populates="patient")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="aide")
    created_at = Column(DateTime(timezone=True), default=now_utc)
    last_login = Column(DateTime(timezone=True))
    
    checkins = relationship("CheckIn", back_populates="user")

class CheckIn(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    category = Column(String, nullable=False)
    data = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=now_utc)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    
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
    created_at = Column(DateTime(timezone=True), default=now_utc)
    
    patient = relationship("Patient", back_populates="medications")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    time_of_day = Column(String, nullable=False)  # e.g. '08:00'
    recurrence_rule = Column(String, nullable=True)  # e.g. 'daily', 'weekly', 'custom'
    day_of_week = Column(String(10), nullable=True)
    timezone = Column(String, nullable=True)
    next_run = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    medication = relationship("Medication")
    user = relationship("User")
    patient = relationship("Patient")


class MedicationAdherence(Base):
    __tablename__ = "medication_adherence"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    taken_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False)  # 'taken', 'skipped', 'late', etc.
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    medication = relationship("Medication")
    user = relationship("User")
    patient = relationship("Patient")


class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    symptom_type = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    severity = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User")
    patient = relationship("Patient")

# Deprecated - keeping for backward compatibility
class PatientInfo(Base):
    __tablename__ = "patient_info"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    allergies = Column(String)
    emergency_contact = Column(String)
    doctor = Column(String)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

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


# Symptom log Pydantic models
class SymptomLogCreate(BaseModel):
    user_id: Optional[int] = None
    patient_id: Optional[int] = None
    symptom_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    severity: Optional[int] = None
    notes: Optional[str] = None


class SymptomLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    patient_id: Optional[int]
    symptom_type: str
    start_time: datetime
    end_time: Optional[datetime]
    severity: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

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


# MedicationSchedule Pydantic models
class MedicationScheduleCreate(BaseModel):
    medication_id: int
    user_id: Optional[int] = None
    patient_id: Optional[int] = None
    time_of_day: str
    recurrence_rule: Optional[str] = None
    day_of_week: Optional[str] = None
    timezone: Optional[str] = None
    next_run: Optional[datetime] = None
    active: Optional[bool] = True
    notes: Optional[str] = None

class MedicationScheduleResponse(BaseModel):
    id: int
    medication_id: int
    user_id: Optional[int]
    patient_id: Optional[int]
    time_of_day: str
    recurrence_rule: Optional[str]
    day_of_week: Optional[str]
    timezone: Optional[str]
    next_run: Optional[datetime]
    active: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# MedicationAdherence Pydantic models
class MedicationAdherenceCreate(BaseModel):
    medication_id: int
    user_id: Optional[int] = None
    patient_id: Optional[int] = None
    scheduled_time: datetime
    taken_time: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

class MedicationAdherenceResponse(BaseModel):
    id: int
    medication_id: int
    user_id: Optional[int]
    patient_id: Optional[int]
    scheduled_time: datetime
    taken_time: Optional[datetime]
    status: str
    notes: Optional[str]
    created_at: datetime

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

# Dependency (moved up so it's available for PDF endpoint)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# PDF Report Generation Endpoint (moved here so 'app' is defined)
@app.get("/api/reports/generate")
def generate_pdf_report(
    patient_id: int,
    from_date: str,
    to_date: str,
    db: Session = Depends(get_db)
):
    try:
        # --- 1. DATA FETCHING ---
        logging.info(f"Generating report for patient {patient_id} from {from_date} to {to_date}")
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        symptoms = db.query(SymptomLog).filter(
            SymptomLog.patient_id == patient_id,
            SymptomLog.start_time >= from_dt,
            SymptomLog.start_time < to_dt
        ).order_by(SymptomLog.start_time.asc()).all()
        
        adherence = db.query(MedicationAdherence).filter(
            MedicationAdherence.patient_id == patient_id,
            MedicationAdherence.scheduled_time >= from_dt,
            MedicationAdherence.scheduled_time < to_dt
        ).order_by(MedicationAdherence.scheduled_time.asc()).all()

        # --- 2. MATPLOTLIB CHART (Defensive Block) ---
        img_buf = io.BytesIO()
        chart_generated_successfully = False

        if symptoms:
            try:
                logging.info("Attempting to generate symptom chart...")
                symptom_counts = {}
                for log in symptoms:
                    day = log.start_time.strftime('%Y-%m-%d')
                    symptom_counts.setdefault(day, 0)
                    symptom_counts[day] += 1
                days = sorted(symptom_counts.keys())
                counts = [symptom_counts[day] for day in days]

                if days: 
                    fig, ax = plt.subplots(figsize=(6, 2.5))
                    ax.bar(days, counts)
                    ax.set_title('Symptom Logs per Day')
                    ax.set_xlabel('Date')
                    ax.set_ylabel('Count')
                    plt.xticks(rotation=45, ha='right')
                    plt.tight_layout()
                    plt.savefig(img_buf, format='png')
                    plt.close(fig)
                    chart_generated_successfully = True
                    logging.info("Symptom chart generated successfully.")
                else:
                    logging.info("No day data to plot, skipping chart.")
            
            except Exception as e:
                # Log the error, but don't crash the entire report
                logging.error(f"Matplotlib chart generation FAILED: {e}", exc_info=True)
                # This often happens on servers without system font/graphics libraries.
                # See my previous message about 'nixpacks.toml' to fix this.

        img_buf.seek(0) 

        # --- 3. PDF GENERATION (In-Memory) ---
        logging.info("Starting PDF document build...")
        pdf_buf = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buf, pagesize=letter,
                                rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        story = []
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Title', fontSize=22, alignment=1, spaceAfter=14))
        styles.add(ParagraphStyle(name='Header', fontSize=14, spaceAfter=12))

        # --- Title and Report Info ---
        story.append(Paragraph("Patient Report", styles['Title']))
        story.append(Paragraph(f"<b>Patient ID:</b> {patient_id}", styles['Normal']))
        story.append(Paragraph(f"<b>Date Range:</b> {from_date} to {to_date}", styles['Normal']))
        story.append(Paragraph(f"<b>Generated:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles['Normal']))
        story.append(Spacer(1, 0.25 * inch))

        # --- Add Chart (Only if it was successful) ---
        story.append(Paragraph("Symptom Log Frequency", styles['Header']))
        
        if chart_generated_successfully:
            story.append(Image(img_buf, width=7*inch, height=2.8*inch))
        elif not symptoms:
            story.append(Paragraph("<i>No symptom data recorded for this period.</i>", styles['Normal']))
        else:
            story.append(Paragraph("<i>Chart could not be generated due to a server error.</i>", styles['Normal']))
            
        story.append(Spacer(1, 0.25 * inch))
        
        # --- Symptom Log Table ---
        story.append(Paragraph("Symptom Logs", styles['Header']))
        symptom_data: list[list[Any]] = [["Date/Time", "Symptom", "Severity", "Notes"]]
        
        if not symptoms:
            symptom_data.append(["-", "No symptom logs for this period", "-", "-"])
        else:
            for log in symptoms:
                symptom_data.append([
                    log.start_time.strftime('%Y-%m-%d %H:%M'),
                    Paragraph(log.symptom_type, styles['Normal']),
                    str(log.severity or '-'),
                    Paragraph(log.notes or '', styles['Normal']) 
                ])

        symptom_table = Table(symptom_data, colWidths=[1.5*inch, 1.5*inch, 0.75*inch, 3.25*inch])
        symptom_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4A90E2")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F3F8FF")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#C2DFFF")),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 1), (2, -1), 'CENTER'),
        ]))
        story.append(symptom_table)
        story.append(PageBreak()) 

        # --- Medication Adherence Table ---
        story.append(Paragraph("Medication Adherence", styles['Header']))
        adherence_data: list[list[Any]] = [["Scheduled Time", "Status", "Notes"]]
        
        if not adherence:
            adherence_data.append(["-", "No adherence logs for this period", "-"])
        else:
            for log in adherence:
                adherence_data.append([
                    log.scheduled_time.strftime('%Y-%m-%d %H:%M'),
                    log.status.title(),
                    Paragraph(log.notes or '', styles['Normal'])
                ])
        
        adherence_table = Table(adherence_data, colWidths=[1.5*inch, 1*inch, 4.5*inch])
        adherence_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#34A853")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F1FBF4")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#BDE9C7")),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 1), (1, -1), 'CENTER'),
        ]))
        story.append(adherence_table)
        
        # --- Build the PDF ---
        logging.info("Building PDF story...")
        doc.build(story)
        
        pdf_buf.seek(0)
        logging.info("PDF built successfully. Returning StreamingResponse.")
        
        return StreamingResponse(
            pdf_buf, 
            media_type='application/pdf', 
            headers={
                'Content-Disposition': 'attachment; filename="patient_report.pdf"'
            }
        )

    except Exception as e:
        # ---!! THIS IS THE MOST IMPORTANT PART !! ---
        # If ANYTHING fails, log the full error and return a proper 500
        # This allows the frontend to get a JSON response and avoids the CORS error
        logging.error(f"CRITICAL: Report generation failed with uncaught exception: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"An internal error occurred during PDF generation: {e}"
        )
    
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
        "https://care-giver-ten.vercel.app",
        "https://care-giver-git-main-traes-projects-9301e5d2.vercel.app",
        "https://care-giver-traes-projects-9301e5d2.vercel.app",   # Vercel deployments (replace * with your app name)
        os.getenv("FRONTEND_URL", "http://localhost:3000")  # Custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    user.last_login = datetime.now(timezone.utc)
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
    
    patient.updated_at = datetime.now(timezone.utc)
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
    # Query for standard check-ins
    checkin_query = db.query(CheckIn).filter(CheckIn.category != "Symptoms")
    if patient_id:
        checkin_query = checkin_query.filter(CheckIn.patient_id == patient_id)
    if user_id:
        checkin_query = checkin_query.filter(CheckIn.user_id == user_id)
    if category:
        checkin_query = checkin_query.filter(CheckIn.category == category)
    
    # Query for symptom logs and transform them into a check-in-like structure
    symptom_query = db.query(SymptomLog)
    if patient_id:
        symptom_query = symptom_query.filter(SymptomLog.patient_id == patient_id)
    if user_id:
        symptom_query = symptom_query.filter(SymptomLog.user_id == user_id)

    # Combine results
    all_checkins = checkin_query.all()
    symptom_logs = symptom_query.all()

    # Convert symptom logs to a common format
    transformed_symptoms = []
    for log in symptom_logs:
        transformed_symptoms.append(CheckIn(
            id=log.id,  # Note: This might cause ID conflicts if not handled on frontend
            user_id=log.user_id,
            patient_id=log.patient_id,
            category="Symptoms",
            data={
                "symptom": log.symptom_type,
                "severity": log.severity,
                "notes": log.notes,
                "start_time": log.start_time.isoformat(),
                "end_time": log.end_time.isoformat() if log.end_time else None,
            },
            timestamp=log.start_time,
            created_at=log.created_at,
            user=log.user,
            patient=log.patient
        ))

    combined_results = all_checkins + transformed_symptoms
    
    # Sort by timestamp descending
    combined_results.sort(key=lambda x: x.timestamp, reverse=True)
    
    return combined_results

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


# Symptom logging endpoints
@app.post("/api/symptom-logs", response_model=SymptomLogResponse)
def create_symptom_log(log: SymptomLogCreate, db: Session = Depends(get_db)):
    if log.end_time and log.end_time < log.start_time:
        raise HTTPException(status_code=400, detail="end_time must be >= start_time")

    db_log = SymptomLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@app.get("/api/symptom-logs", response_model=List[SymptomLogResponse])
def list_symptom_logs(
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    symptom_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SymptomLog)

    if user_id:
        query = query.filter(SymptomLog.user_id == user_id)
    if patient_id:
        query = query.filter(SymptomLog.patient_id == patient_id)
    if symptom_type:
        query = query.filter(SymptomLog.symptom_type == symptom_type)
    if from_date:
        try:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            query = query.filter(SymptomLog.start_time >= from_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
    if to_date:
        try:
            to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(SymptomLog.start_time < to_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")

    logs = query.order_by(SymptomLog.start_time.desc()).all()
    return logs


@app.get("/api/reports/symptom-agg")
def symptom_aggregation(
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    group_by: str = "day",
    db: Session = Depends(get_db)
):
    # Supported group_by: day, week, month
    query = db.query(SymptomLog)

    if user_id:
        query = query.filter(SymptomLog.user_id == user_id)
    if patient_id:
        query = query.filter(SymptomLog.patient_id == patient_id)
    if from_date:
        try:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            query = query.filter(SymptomLog.start_time >= from_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")
    if to_date:
        try:
            to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(SymptomLog.start_time < to_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")

    # Build aggregation
    if group_by == "day":
        fmt = 'YYYY-MM-DD'
    elif group_by == "week":
        fmt = 'IYYY-IW'  # ISO week format for PostgreSQL
    elif group_by == "month":
        fmt = 'YYYY-MM'
    else:
        raise HTTPException(status_code=400, detail="group_by must be 'day', 'week', or 'month'")

    results = (
        db.query(
            func.to_char(SymptomLog.start_time, fmt).label("period"),
            SymptomLog.symptom_type,
            func.avg(SymptomLog.severity).label("avg_severity")
        )
        .group_by("period", SymptomLog.symptom_type)
        .order_by("period")
        .all()
    )

    # Transform results into nested dict { period: { symptom_type: avg_severity } }
    out = {}
    for period, symptom_type, avg_severity in results:
        out.setdefault(period, {})[symptom_type] = avg_severity

    return out

@app.get("/api/checkins/medications")
async def get_medication_checks(date: str, db: Session = Depends(get_db)):
    # Convert date string to date object
    check_date = datetime.strptime(date, "%Y-%m-%d").date()
    
    # Query check-ins for this date
    check_ins = db.query(CheckIn).filter(
        CheckIn.category == "Medications",
        CheckIn.created_at >= check_date,
        CheckIn.created_at < check_date + timedelta(days=1)
    ).all()
    
    return check_ins

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


# MedicationSchedule endpoints
@app.post("/api/medication-schedules", response_model=MedicationScheduleResponse)
def create_medication_schedule(schedule: MedicationScheduleCreate, db: Session = Depends(get_db)):
    schedule_data = schedule.dict()
    # If the rule isn't weekly, force day_of_week to be null
    if schedule_data.get("recurrence_rule") != "weekly":
        schedule_data["day_of_week"] = None
    
    db_schedule = MedicationSchedule(**schedule_data)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.get("/api/medication-schedules", response_model=List[MedicationScheduleResponse])
def list_medication_schedules(
    medication_id: Optional[int] = None,
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicationSchedule)
    if medication_id:
        query = query.filter(MedicationSchedule.medication_id == medication_id)
    if user_id:
        query = query.filter(MedicationSchedule.user_id == user_id)
    if patient_id:
        query = query.filter(MedicationSchedule.patient_id == patient_id)
    return query.order_by(MedicationSchedule.time_of_day).all()

@app.put("/api/medication-schedules/{schedule_id}", response_model=MedicationScheduleResponse)
def update_medication_schedule(schedule_id: int, updates: MedicationScheduleCreate, db: Session = Depends(get_db)):
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(schedule, key, value)
    if schedule.recurrence_rule != "weekly":
        schedule.day_of_week = None
    db.commit()
    db.refresh(schedule)
    return schedule

@app.delete("/api/medication-schedules/{schedule_id}")
def delete_medication_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(MedicationSchedule).filter(MedicationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}

# MedicationAdherence endpoints
@app.post("/api/medication-adherence", response_model=MedicationAdherenceResponse)
def create_medication_adherence(adherence: MedicationAdherenceCreate, db: Session = Depends(get_db)):
    db_adherence = MedicationAdherence(**adherence.dict())
    db.add(db_adherence)
    db.commit()
    db.refresh(db_adherence)
    return db_adherence

@app.get("/api/medication-adherence", response_model=List[MedicationAdherenceResponse])
def list_medication_adherence(
    medication_id: Optional[int] = None,
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicationAdherence)
    if medication_id:
        query = query.filter(MedicationAdherence.medication_id == medication_id)
    if user_id:
        query = query.filter(MedicationAdherence.user_id == user_id)
    if patient_id:
        query = query.filter(MedicationAdherence.patient_id == patient_id)
    return query.order_by(MedicationAdherence.scheduled_time.desc()).all()

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
    
    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return patient

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
