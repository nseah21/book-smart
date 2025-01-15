from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models import Participant
from app.database import SessionLocal

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for login request body
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    participant = db.query(Participant).filter(Participant.email == request.email).first()
    if not participant or not participant.verify_password(request.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Simulate session token
    session_token = f"fake-token-for-{participant.id}"
    return {"message": "Login successful", "session_token": session_token}
