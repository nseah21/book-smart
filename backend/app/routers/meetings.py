from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Meeting, Participant, Category
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time

router = APIRouter()

# Pydantic models for request and response
class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    start_time: time
    end_time: time
    participant_ids: List[int]
    category_ids: Optional[List[int]] = None
    color: Optional[str] = None

class ParticipantResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        orm_mode = True

class CategoryResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class MeetingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: date
    start_time: time
    end_time: time
    color: Optional[str]
    categories: List[CategoryResponse]
    participants: List[ParticipantResponse]

    class Config:
        orm_mode = True

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=MeetingResponse)
def create_meeting(meeting_data: MeetingCreate, db: Session = Depends(get_db)):
    participants = db.query(Participant).filter(Participant.id.in_(meeting_data.participant_ids)).all()
    if len(participants) != len(meeting_data.participant_ids):
        raise HTTPException(status_code=404, detail="One or more participants not found")

    categories = []
    if meeting_data.category_ids:
        categories = db.query(Category).filter(Category.id.in_(meeting_data.category_ids)).all()
        if len(categories) != len(meeting_data.category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")

    meeting = Meeting(
        title=meeting_data.title,
        description=meeting_data.description,
        date=meeting_data.date,
        start_time=meeting_data.start_time,
        end_time=meeting_data.end_time,
        color=meeting_data.color,
        participants=participants,
        categories=categories,
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@router.get("/", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).all()
    return meetings
