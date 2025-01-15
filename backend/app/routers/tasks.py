from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Task, Participant, Category
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

# Pydantic models for request and response
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    color: Optional[str] = None
    participant_ids: Optional[List[int]] = None
    category_ids: Optional[List[int]] = None

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

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: date
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

@router.post("/", response_model=TaskResponse)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    participants = []
    if task_data.participant_ids:
        participants = db.query(Participant).filter(Participant.id.in_(task_data.participant_ids)).all()
        if len(participants) != len(task_data.participant_ids):
            raise HTTPException(status_code=404, detail="One or more participants not found")

    categories = []
    if task_data.category_ids:
        categories = db.query(Category).filter(Category.id.in_(task_data.category_ids)).all()
        if len(categories) != len(task_data.category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")

    task = Task(
        title=task_data.title,
        description=task_data.description,
        due_date=task_data.due_date,
        color=task_data.color,
        participants=participants,
        categories=categories,
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return tasks
