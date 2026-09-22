"""개발용 더미 데이터 시딩 스크립트.

사용자 8명, 게시물 24개, 팔로우/좋아요/댓글/DM 더미 데이터를 생성한다.
실행: python seed.py
"""

import random

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Comment, DirectMessage, DirectThread, Follow, Like, Post, PostImage, User

USERNAMES = ["alice", "bob", "carol", "dave", "erin", "frank", "grace", "heidi"]
SAMPLE_IMAGE_URL = "https://picsum.photos/seed/{seed}/600/600"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "pass123"


def ensure_admin_user(db) -> None:
    """관리자 계정을 항상 보장한다(더미 데이터 시딩 여부와 무관하게 매번 확인).

    pass123은 일반 회원가입 스키마의 최소 길이(8자) 제약보다 짧지만, 관리자 계정은
    회원가입 API를 거치지 않고 여기서 직접 생성하므로 그 제약이 적용되지 않는다.
    """
    admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if admin is None:
        db.add(
            User(
                username=ADMIN_USERNAME,
                email="admin@instagram.local",
                hashed_password=hash_password(ADMIN_PASSWORD),
                full_name="Admin",
                is_admin=True,
            )
        )
        db.commit()
        print("관리자 계정 생성 완료 (admin / pass123)")
    elif not admin.is_admin:
        admin.is_admin = True
        db.commit()
        print("기존 admin 계정에 관리자 권한을 부여했습니다")


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_admin_user(db)

        if db.query(User).filter(User.username != ADMIN_USERNAME).count() > 0:
            print("이미 데이터가 존재합니다. 더미 데이터 시딩을 건너뜁니다.")
            return

        users = []
        for name in USERNAMES:
            user = User(
                username=name,
                email=f"{name}@example.com",
                hashed_password=hash_password("password123"),
                full_name=name.capitalize(),
                bio=f"안녕하세요, {name}입니다.",
            )
            db.add(user)
            users.append(user)
        db.flush()

        for follower in users:
            for following in users:
                if follower is not following and random.random() < 0.6:
                    db.add(Follow(follower_id=follower.id, following_id=following.id))

        posts = []
        for i in range(24):
            author = random.choice(users)
            post = Post(user_id=author.id, caption=f"게시물 #{i + 1} 입니다 🌤️", location="Seoul")
            db.add(post)
            db.flush()
            db.add(PostImage(post_id=post.id, image_url=SAMPLE_IMAGE_URL.format(seed=post.id), order_index=0))
            posts.append(post)

        for post in posts:
            for user in random.sample(users, k=random.randint(0, len(users))):
                db.add(Like(user_id=user.id, post_id=post.id))
            for user in random.sample(users, k=random.randint(0, 2)):
                db.add(Comment(post_id=post.id, user_id=user.id, content="멋진 사진이네요!"))

        for participant_index in (1, 4, 2, 6):
            user_a_id, user_b_id = sorted((users[0].id, users[participant_index].id))
            thread = DirectThread(user_a_id=user_a_id, user_b_id=user_b_id)
            db.add(thread)
            db.flush()
            db.add_all(
                [
                    DirectMessage(
                        thread_id=thread.id,
                        sender_id=users[0].id,
                        content="안녕하세요!",
                    ),
                    DirectMessage(
                        thread_id=thread.id,
                        sender_id=users[participant_index].id,
                        content="반가워요.",
                        is_read=False,
                    ),
                ]
            )

        db.commit()
        print("시드 데이터 생성 완료")
    finally:
        db.close()


if __name__ == "__main__":
    run()
