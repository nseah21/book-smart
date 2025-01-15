from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Table, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app.database import engine  # Import engine from database.py
import enum

Base = declarative_base()


class RecurrenceFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


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

    categories = relationship(
        "Category", secondary=category_task, back_populates="tasks"
    )


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

    meetings = relationship(
        "Meeting", secondary=meeting_participant, back_populates="participants"
    )


Base.metadata.create_all(bind=engine)
