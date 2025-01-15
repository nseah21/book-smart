from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models import Participant
from app.database import SessionLocal

router = APIRouter()

# Pydantic model for the signup request body
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check if the email is already registered
    existing_user = db.query(Participant).filter(Participant.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new participant and hash the password
    new_participant = Participant(name=request.name, email=request.email)
    new_participant.set_password(request.password)
    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)

    return {"message": "User signed up successfully", "user_id": new_participant.id}
