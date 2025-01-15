import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_folder = os.path.join(os.path.dirname(__file__), "../data")
os.makedirs(db_folder, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(db_folder, 'app.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
