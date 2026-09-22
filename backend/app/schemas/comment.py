from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    parent_id: int | None = None


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    author: UserPublic
    parent_id: int | None
    content: str
    like_count: int = 0
    is_liked: bool = False
    created_at: datetime
    replies: list["CommentResponse"] = Field(default_factory=list)


CommentResponse.model_rebuild()


class PaginatedComments(BaseModel):
    items: list[CommentResponse]
    next_cursor: str | None = None
    has_more: bool = False
