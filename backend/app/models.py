from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Time,
    ForeignKey,
    Table,
    Enum,
    DateTime,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app.database import engine  # Import engine from database.py
from passlib.context import CryptContext
import enum

Base = declarative_base()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class RecurrenceFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


task_participant = Table(
    "task_participant",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("participant_id", Integer, ForeignKey("participants.id"), primary_key=True),
)

meeting_participant = Table(
    "meeting_participant",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meetings.id"), primary_key=True),
    Column("participant_id", Integer, ForeignKey("participants.id"), primary_key=True),
)

category_task = Table(
    "category_task",
    Base.metadata,
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
)

category_meeting = Table(
    "category_meeting",
    Base.metadata,
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
    Column("meeting_id", Integer, ForeignKey("meetings.id"), primary_key=True),
)

reminder_participant = Table(
    "reminder_participant",
    Base.metadata,
    Column("reminder_id", Integer, ForeignKey("reminders.id"), primary_key=True),
    Column("participant_id", Integer, ForeignKey("participants.id"), primary_key=True),
)


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    reminder_time = Column(DateTime, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)

    # Relationships
    participants = relationship(
        "Participant", secondary=reminder_participant, back_populates="reminders"
    )
    task = relationship("Task", back_populates="reminders")
    meeting = relationship("Meeting", back_populates="reminders")


class RecurrenceRule(Base):
    __tablename__ = "recurrence_rules"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    frequency = Column(Enum(RecurrenceFrequency), nullable=False)
    interval = Column(Integer, default=1)  # Every n days, weeks, months, etc.
    end_date = Column(Date, nullable=True)  # Optional end date for the recurrence

    meeting = relationship("Meeting", back_populates="recurrence_rule")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(Date, nullable=False)
    color = Column(String, nullable=True)
    participants = relationship(
        "Participant", secondary=task_participant, back_populates="tasks"
    )

    categories = relationship(
        "Category", secondary=category_task, back_populates="tasks"
    )
    reminders = relationship("Reminder", back_populates="task")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    color = Column(String, nullable=True)

    categories = relationship(
        "Category", secondary=category_meeting, back_populates="meetings"
    )
    participants = relationship(
        "Participant", secondary=meeting_participant, back_populates="meetings"
    )
    recurrence_rule = relationship(
        "RecurrenceRule", uselist=False, back_populates="meeting"
    )
    reminders = relationship("Reminder", back_populates="meeting")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)

    tasks = relationship("Task", secondary=category_task, back_populates="categories")
    meetings = relationship(
        "Meeting", secondary=category_meeting, back_populates="categories"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)

    tasks = relationship(
        "Task", secondary=task_participant, back_populates="participants"
    )
    meetings = relationship(
        "Meeting", secondary=meeting_participant, back_populates="participants"
    )
    reminders = relationship(
        "Reminder", secondary=reminder_participant, back_populates="participants"
    )

    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)


Base.metadata.create_all(bind=engine)
