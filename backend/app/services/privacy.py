"""비공개 계정(is_private) 게시물 노출 규칙 (backend.md 5.4절).

EditProfilePage 안내 문구("비공개 계정: 팔로워만 게시물을 볼 수 있습니다") 기준으로
게시물 관련 조회에만 적용한다. 팔로워/팔로잉 목록, 프로필 기본 정보는 잠그지 않는다.
"""

from sqlalchemy.orm import Session

from app.models.follow import Follow
from app.models.user import User


def is_following(db: Session, follower_id: int | None, following_id: int) -> bool:
    if follower_id is None:
        return False
    return (
        db.query(Follow.id)
        .filter(Follow.follower_id == follower_id, Follow.following_id == following_id)
        .first()
        is not None
    )


def can_view_posts(db: Session, author: User, viewer: User | None) -> bool:
    """author의 게시물을 viewer가 볼 수 있는지 여부."""
    if not author.is_private:
        return True
    if viewer is None:
        return False
    if viewer.id == author.id:
        return True
    return is_following(db, viewer.id, author.id)


def hidden_private_author_ids(db: Session, viewer: User | None) -> list[int]:
    """피드/탐색 목록 쿼리에서 제외해야 할, viewer가 볼 수 없는 비공개 계정 작성자 id 목록."""
    query = db.query(User.id).filter(User.is_private.is_(True))
    if viewer is not None:
        following_ids = [
            row[0]
            for row in db.query(Follow.following_id).filter(Follow.follower_id == viewer.id).all()
        ]
        query = query.filter(User.id != viewer.id)
        if following_ids:
            query = query.filter(~User.id.in_(following_ids))
    return [row[0] for row in query.all()]
