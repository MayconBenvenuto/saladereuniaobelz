from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date, time, timedelta
from typing import Optional, List
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from bson import ObjectId
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is required")

client = AsyncIOMotorClient(MONGO_URL)
db = client.meeting_room_db
appointments_collection = db.appointments

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

# Helper functions
def appointment_to_dict(appointment: dict) -> dict:
    """Convert MongoDB appointment to response format"""
    return {
        "id": appointment["id"],
        "name": appointment["name"],
        "date": appointment["date"],
        "start_time": appointment["start_time"],
        "end_time": appointment["end_time"],
        "title": appointment["title"],
        "participants": appointment.get("participants"),
        "created_at": appointment["created_at"]
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
    return {"message": "Belz Meeting Room Booking API"}

@app.post("/api/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate):
    """Create a new appointment"""
    try:
        # Check for conflicts
        existing_appointments = await appointments_collection.find({
            "date": appointment.date.isoformat()
        }).to_list(length=None)
        
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
        appointment_doc = {
            "id": appointment_id,
            "name": appointment.name,
            "date": appointment.date.isoformat(),
            "start_time": appointment.start_time.isoformat(),
            "end_time": appointment.end_time.isoformat(),
            "title": appointment.title,
            "participants": appointment.participants,
            "created_at": datetime.now().isoformat()
        }
        
        result = await appointments_collection.insert_one(appointment_doc)
        
        if result.inserted_id:
            return AppointmentResponse(
                id=appointment_id,
                name=appointment.name,
                date=appointment.date,
                start_time=appointment.start_time,
                end_time=appointment.end_time,
                title=appointment.title,
                participants=appointment.participants,
                created_at=datetime.now()
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create appointment")
            
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/appointments/{appointment_date}")
async def get_appointments_by_date(appointment_date: str):
    """Get all appointments for a specific date"""
    try:
        appointments = await appointments_collection.find({
            "date": appointment_date
        }).to_list(length=None)
        
        result = []
        for appointment in appointments:
            result.append(appointment_to_dict(appointment))
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/availability/{appointment_date}")
async def get_availability(appointment_date: str):
    """Get availability for a specific date"""
    try:
        appointments = await appointments_collection.find({
            "date": appointment_date
        }).to_list(length=None)
        
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
                appt_start = datetime.fromisoformat(appointment["start_time"]).time()
                appt_end = datetime.fromisoformat(appointment["end_time"]).time()
                
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
        result = await appointments_collection.delete_one({"id": appointment_id})
        
        if result.deleted_count == 0:
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
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "database": "disconnected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)