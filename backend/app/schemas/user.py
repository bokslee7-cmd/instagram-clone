from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None = None
    avatar_url: str | None = None


class UserProfile(UserPublic):
    bio: str | None = None
    website: str | None = None
    is_private: bool
    post_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False


class UserMe(UserProfile):
    email: str
    is_admin: bool = False


class UserUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=30)
    full_name: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    bio: str | None = Field(default=None, max_length=150)
    website: str | None = Field(default=None, max_length=255)
    is_private: bool | None = None


class PaginatedUsers(BaseModel):
    items: list[UserPublic]
    next_cursor: str | None = None
    has_more: bool = False
