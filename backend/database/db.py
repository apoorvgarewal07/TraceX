import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.schemas import Base

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./cryptofraud.db')

def get_db_engine():
    db_url = os.getenv('DATABASE_URL', 'sqlite:///./cryptofraud.db')
    try:
        if db_url.startswith("sqlite"):
            return create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            return create_engine(db_url, echo=False, pool_pre_ping=True)
    except Exception as e:
        logger.warning(f"Failed to connect to primary DB ({db_url}), falling back to SQLite: {e}")
        return create_engine("sqlite:///./cryptofraud.db", connect_args={"check_same_thread": False})

engine = get_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        return False
