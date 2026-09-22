from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class DirectMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime


class DirectThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    participant: UserPublic
    last_message: DirectMessageResponse | None = None
    unread_count: int = 0
    updated_at: datetime


class DirectThreadDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    thread: DirectThreadResponse
    messages: list[DirectMessageResponse]


class StartThreadRequest(BaseModel):
    username: str


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class UnreadThreadCountResponse(BaseModel):
    count: int
