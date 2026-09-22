from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class PostImageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    order_index: int


class PostCreateRequest(BaseModel):
    caption: str | None = Field(default=None, max_length=2200)
    location: str | None = Field(default=None, max_length=100)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author: UserPublic
    caption: str | None
    location: str | None
    images: list[PostImageSchema]
    like_count: int = 0
    comment_count: int = 0
    is_liked: bool = False
    is_saved: bool = False
    created_at: datetime


class PaginatedPosts(BaseModel):
    items: list[PostResponse]
    next_cursor: str | None = None
    has_more: bool = False
