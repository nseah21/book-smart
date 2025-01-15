from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Task, Category
from typing import List
from datetime import datetime

router = APIRouter()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=dict)
def create_task(
    title: str,
    description: str,
    due_date: str,
    color: str = None,
    category_ids: List[int] = None,
    db: Session = Depends(get_db),
):
    due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
    task = Task(
        title=title, description=description, due_date=due_date_obj, color=color
    )
    if category_ids:
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")
        task.categories = categories
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"message": "Task created successfully", "task_id": task.id}


@router.get("/", response_model=List[dict])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": str(task.due_date),
            "color": task.color,
            "categories": [{"id": cat.id, "name": cat.name} for cat in task.categories],
        }
        for task in tasks
    ]


@router.get("/{task_id}", response_model=dict)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "due_date": str(task.due_date),
        "color": task.color,
        "categories": [{"id": cat.id, "name": cat.name} for cat in task.categories],
    }


@router.put("/{task_id}", response_model=dict)
def update_task(
    task_id: int,
    title: str = None,
    description: str = None,
    due_date: str = None,
    color: str = None,
    category_ids: List[int] = None,
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields if provided
    if title:
        task.title = title
    if description:
        task.description = description
    if due_date:
        task.due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
    if color:
        task.color = color
    if category_ids is not None:
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            raise HTTPException(status_code=404, detail="One or more categories not found")
        task.categories = categories

    db.commit()
    return {"message": "Task updated successfully"}


@router.delete("/{task_id}", response_model=dict)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
