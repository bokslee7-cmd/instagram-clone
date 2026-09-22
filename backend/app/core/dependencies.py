from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """토큰이 없거나 유효하지 않으면 예외 대신 None을 반환한다.

    피드/탐색/게시물 상세/프로필 등 게스트도 조회 가능한 엔드포인트에서 사용하며,
    로그인 사용자에게는 is_liked/is_saved/is_following 등 개인화 필드를 채우고
    게스트에게는 false로 내려주기 위한 용도다 (backend.md 3.1절).
    """
    if token is None:
        return None

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        return None

    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """관리자 전용 엔드포인트(/api/admin/*) 접근 제어."""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 접근할 수 있습니다")
    return current_user
