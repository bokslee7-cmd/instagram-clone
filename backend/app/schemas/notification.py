from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.post import PostImageSchema
from app.schemas.user import UserPublic


class NotificationPostPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    images: list[PostImageSchema]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    actor: UserPublic
    post: NotificationPostPreview | None = None
    is_read: bool
    created_at: datetime


class PaginatedNotifications(BaseModel):
    items: list[NotificationResponse]
    next_cursor: str | None = None
    has_more: bool = False


class UnreadCountResponse(BaseModel):
    count: int
