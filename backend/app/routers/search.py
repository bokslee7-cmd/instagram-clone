from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserPublic

router = APIRouter(prefix="/api/search", tags=["search"])

MAX_RESULTS = 20


@router.get("/users", response_model=list[UserPublic])
def search_users(q: str = Query(default=""), db: Session = Depends(get_db)) -> list[User]:
    keyword = q.strip()
    if not keyword:
        return []

    pattern = f"%{keyword}%"
    return (
        db.query(User)
        .filter(or_(User.username.ilike(pattern), User.full_name.ilike(pattern)))
        .order_by(User.username.asc())
        .limit(MAX_RESULTS)
        .all()
    )
