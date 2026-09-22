from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.post import PostResponse


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    is_private: bool
    is_active: bool
    is_admin: bool
    created_at: datetime
    post_count: int = 0
    follower_count: int = 0
    following_count: int = 0


class PaginatedAdminUsers(BaseModel):
    items: list[AdminUserResponse]
    page: int
    size: int
    total: int
    total_pages: int


class PaginatedAdminPosts(BaseModel):
    items: list[PostResponse]
    page: int
    size: int
    total: int
    total_pages: int


class DailySignupCount(BaseModel):
    date: str
    count: int


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    deactivated_users: int
    total_posts: int
    total_comments: int
    total_likes: int
    total_follows: int
    total_direct_messages: int
    new_users_today: int
    signups_last_14_days: list[DailySignupCount]
    top_posts: list[PostResponse]
