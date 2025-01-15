from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Category
from typing import List

router = APIRouter()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[dict])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return [{"id": c.id, "name": c.name} for c in categories]


@router.get("/{category_id}", response_model=dict)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"id": category.id, "name": category.name, "color": category.color}


@router.post("/", response_model=dict)
def create_category(name: str, color: str, db: Session = Depends(get_db)):
    # Check if category name is unique
    existing_category = db.query(Category).filter(Category.name == name).first()
    if existing_category:
        raise HTTPException(
            status_code=400, detail="Category with this name already exists"
        )

    category = Category(name=name, color=color)
    db.add(category)
    db.commit()
    db.refresh(category)
    return {"message": "Category created successfully", "category_id": category.id}


@router.put("/{category_id}", response_model=dict)
def update_category(
    category_id: int, name: str = None, color: str = None, db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if name:
        # Ensure the new name is unique
        existing_category = (
            db.query(Category)
            .filter(Category.name == name, Category.id != category_id)
            .first()
        )
        if existing_category:
            raise HTTPException(
                status_code=400, detail="Category with this name already exists"
            )
        category.name = name
    if color:
        category.color = color

    db.commit()
    return {"message": "Category updated successfully"}


@router.delete("/{category_id}", response_model=dict)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
