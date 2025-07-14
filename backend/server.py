from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date, time, timedelta
from typing import Optional, List
import os
import sqlite3
import uuid
import logging
from contextlib import contextmanager
import threading

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Belz Meeting Room Booking API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite database setup
DATABASE_PATH = "/app/backend/meeting_room.db"
db_lock = threading.Lock()

# Pydantic models
class AppointmentCreate(BaseModel):
    name: str
    date: date
    start_time: time
    end_time: time
    title: str
    participants: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    name: str
    date: date
    start_time: time
    end_time: time
    title: str
    participants: Optional[str] = None
    created_at: datetime

class AvailabilityRequest(BaseModel):
    date: date

# Database helper functions
@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    with db_lock:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

def init_database():
    """Initialize SQLite database with required tables"""
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                title TEXT NOT NULL,
                participants TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()

# Initialize database on startup
init_database()

# Helper functions
def appointment_from_row(row) -> dict:
    """Convert SQLite row to appointment dict"""
    return {
        "id": row["id"],
        "name": row["name"],
        "date": row["date"],
        "start_time": row["start_time"],
        "end_time": row["end_time"],
        "title": row["title"],
        "participants": row["participants"],
        "created_at": row["created_at"]
    }

def time_to_minutes(time_obj: time) -> int:
    """Convert time object to minutes since midnight"""
    return time_obj.hour * 60 + time_obj.minute

def check_time_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """Check if two time ranges overlap"""
    start1_min = time_to_minutes(start1)
    end1_min = time_to_minutes(end1)
    start2_min = time_to_minutes(start2)
    end2_min = time_to_minutes(end2)
    
    return start1_min < end2_min and start2_min < end1_min

# API Routes

@app.get("/api/")
async def root():
    return {"message": "Belz Meeting Room Booking API with SQLite"}

@app.post("/api/appointments", response_model=AppointmentResponse, status_code=201)
async def create_appointment(appointment: AppointmentCreate):
    """Create a new appointment"""
    try:
        # Check for conflicts
        with get_db_connection() as conn:
            existing_appointments = conn.execute(
                "SELECT * FROM appointments WHERE date = ?",
                (appointment.date.isoformat(),)
            ).fetchall()
            
            for existing in existing_appointments:
                existing_start = time.fromisoformat(existing["start_time"])
                existing_end = time.fromisoformat(existing["end_time"])
                
                if check_time_overlap(appointment.start_time, appointment.end_time, existing_start, existing_end):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Time conflict with existing appointment: {existing['title']} by {existing['name']}"
                    )
        
        # Create new appointment
        appointment_id = str(uuid.uuid4())
        created_at = datetime.now()
        
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO appointments (id, name, date, start_time, end_time, title, participants, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                appointment_id,
                appointment.name,
                appointment.date.isoformat(),
                appointment.start_time.isoformat(),
                appointment.end_time.isoformat(),
                appointment.title,
                appointment.participants,
                created_at.isoformat()
            ))
            conn.commit()
        
        return AppointmentResponse(
            id=appointment_id,
            name=appointment.name,
            date=appointment.date,
            start_time=appointment.start_time,
            end_time=appointment.end_time,
            title=appointment.title,
            participants=appointment.participants,
            created_at=created_at
        )
            
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/appointments/{appointment_date}")
async def get_appointments_by_date(appointment_date: str):
    """Get all appointments for a specific date"""
    try:
        with get_db_connection() as conn:
            appointments = conn.execute(
                "SELECT * FROM appointments WHERE date = ? ORDER BY start_time",
                (appointment_date,)
            ).fetchall()
            
            result = []
            for appointment in appointments:
                result.append(appointment_from_row(appointment))
            
            return result
        
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/availability/{appointment_date}")
async def get_availability(appointment_date: str):
    """Get availability for a specific date"""
    try:
        with get_db_connection() as conn:
            appointments = conn.execute(
                "SELECT * FROM appointments WHERE date = ?",
                (appointment_date,)
            ).fetchall()
        
        # Generate time slots (8 AM to 8 PM in 30-minute intervals)
        time_slots = []
        current_time = time(8, 0)  # 8:00 AM
        end_time = time(20, 0)     # 8:00 PM
        
        while current_time < end_time:
            slot_end = (datetime.combine(date.today(), current_time) + timedelta(minutes=30)).time()
            if slot_end > end_time:
                slot_end = end_time
            
            slot_available = True
            conflicting_appointment = None
            
            # Check if this slot conflicts with any appointment
            for appointment in appointments:
                appt_start = time.fromisoformat(appointment["start_time"])
                appt_end = time.fromisoformat(appointment["end_time"])
                
                if check_time_overlap(current_time, slot_end, appt_start, appt_end):
                    slot_available = False
                    conflicting_appointment = {
                        "title": appointment["title"],
                        "name": appointment["name"],
                        "start_time": appointment["start_time"],
                        "end_time": appointment["end_time"]
                    }
                    break
            
            time_slots.append({
                "start_time": current_time.isoformat(),
                "end_time": slot_end.isoformat(),
                "available": slot_available,
                "appointment": conflicting_appointment
            })
            
            current_time = slot_end
        
        return {
            "date": appointment_date,
            "slots": time_slots
        }
        
    except Exception as e:
        logger.error(f"Error fetching availability: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    """Delete an appointment"""
    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM appointments WHERE id = ?",
                (appointment_id,)
            )
            conn.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Appointment not found")
        
        return {"message": "Appointment deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting appointment: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check
@app.get("/api/health")
async def health_check():
    try:
        # Test database connection
        with get_db_connection() as conn:
            conn.execute("SELECT 1").fetchone()
        return {"status": "healthy", "database": "connected", "database_type": "SQLite"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "database": "disconnected"}

# Get all appointments (for debugging)
@app.get("/api/appointments")
async def get_all_appointments():
    """Get all appointments (for debugging)"""
    try:
        with get_db_connection() as conn:
            appointments = conn.execute(
                "SELECT * FROM appointments ORDER BY date, start_time"
            ).fetchall()
            
            result = []
            for appointment in appointments:
                result.append(appointment_from_row(appointment))
            
            return result
        
    except Exception as e:
        logger.error(f"Error fetching all appointments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)