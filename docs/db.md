# 데이터베이스 설계 명세서 (md.md)

## 1. 개요

- DBMS: SQLite3
- ORM: SQLAlchemy (FastAPI 백엔드에서 사용)
- 마이그레이션: Alembic
- 문자 인코딩: UTF-8
- 시간 저장: UTC 기준 `DATETIME` (ISO 8601 문자열 또는 SQLite `TIMESTAMP`)
- 기본 키: 모든 테이블은 SQLite의 `INTEGER PRIMARY KEY` 사용 (명시적 `AUTOINCREMENT`는 사용하지 않음)
- 참조 무결성: SQLite에서 `PRAGMA foreign_keys = ON` 필수 적용

---

## 2. ERD 개요 (텍스트 기반)

```
users 1───N posts
users 1───N comments
users 1───N likes
users 1───N saved_posts
users 1───N notifications (receiver)
users N───N users (follows: follower_id, following_id)
posts 1───N post_images
posts 1───N comments
posts 1───N likes
posts 1───N saved_posts
comments 1───N comments (parent_id, 대댓글)
comments 1───N comment_likes
users N───N users (direct_threads 경유, 1:1 대화방)
direct_threads 1───N direct_messages
```

---

## 3. 테이블 정의

### 3.1 users (사용자)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 사용자 고유 ID |
| username | VARCHAR(30) | UNIQUE, NOT NULL | 로그인/표시용 아이디 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt 해시된 비밀번호 |
| full_name | VARCHAR(50) | NULL | 실명/표시 이름 |
| bio | VARCHAR(150) | NULL | 자기소개 |
| avatar_url | VARCHAR(500) | NULL | 프로필 이미지 경로 |
| website | VARCHAR(255) | NULL | 웹사이트 링크 |
| is_private | BOOLEAN | ORM DEFAULT FALSE, NOT NULL | 비공개 계정 여부 |
| is_active | BOOLEAN | ORM DEFAULT TRUE, NOT NULL | 계정 활성화 여부(탈퇴/정지 시 FALSE, 로그인 즉시 차단) |
| is_admin | BOOLEAN | ORM DEFAULT FALSE, NOT NULL | 관리자 여부 (`/api/admin/*` 접근 권한) |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 가입일 |
| updated_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 정보 수정일 |

인덱스: `username`, `email` UNIQUE INDEX

---

### 3.2 posts (게시물)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 게시물 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 작성자 |
| caption | TEXT | NULL | 게시물 본문 |
| location | VARCHAR(100) | NULL | 위치 태그(텍스트) |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 작성일 |
| updated_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 수정일 |

외래키: `user_id` → `users.id` ON DELETE CASCADE
인덱스: `(user_id, created_at DESC)` — 프로필 게시물 목록 조회용, `created_at DESC` — 피드/탐색 조회용

---

### 3.3 post_images (게시물 이미지, 캐러셀 지원)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 이미지 ID |
| post_id | INTEGER | FK → posts.id, NOT NULL | 소속 게시물 |
| image_url | VARCHAR(500) | NOT NULL | 이미지 저장 경로 |
| order_index | INTEGER | DEFAULT 0 | 캐러셀 내 순서 |

외래키: `post_id` → `posts.id` ON DELETE CASCADE
인덱스: `(post_id, order_index)`

---

### 3.4 follows (팔로우 관계)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 관계 ID |
| follower_id | INTEGER | FK → users.id, NOT NULL | 팔로우 하는 사람 |
| following_id | INTEGER | FK → users.id, NOT NULL | 팔로우 당하는 사람 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 팔로우 시작일 |

제약조건: `UNIQUE(follower_id, following_id)`, `CHECK(follower_id != following_id)`
외래키: 둘 다 ON DELETE CASCADE
인덱스: `follower_id`, `following_id`

---

### 3.5 likes (게시물 좋아요)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 좋아요 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 좋아요 누른 사용자 |
| post_id | INTEGER | FK → posts.id, NOT NULL | 대상 게시물 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 좋아요 시각 |

제약조건: `UNIQUE(user_id, post_id)` — 중복 좋아요 방지
외래키: 둘 다 ON DELETE CASCADE
인덱스: `post_id` (좋아요 수 집계용)

---

### 3.6 comments (댓글, 대댓글 포함)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 댓글 ID |
| post_id | INTEGER | FK → posts.id, NOT NULL | 대상 게시물 |
| user_id | INTEGER | FK → users.id, NOT NULL | 작성자 |
| parent_id | INTEGER | FK → comments.id, NULL | 부모 댓글(대댓글인 경우) |
| content | VARCHAR(500) | NOT NULL | 댓글 내용 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 작성일 |

외래키: `post_id` ON DELETE CASCADE, `user_id` ON DELETE CASCADE, `parent_id` ON DELETE CASCADE
인덱스: `(post_id, created_at)`, `parent_id`

---

### 3.7 comment_likes (댓글 좋아요)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 좋아요 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 사용자 |
| comment_id | INTEGER | FK → comments.id, NOT NULL | 대상 댓글 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 시각 |

제약조건: `UNIQUE(user_id, comment_id)`

---

### 3.8 saved_posts (북마크/저장)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 저장 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 저장한 사용자 |
| post_id | INTEGER | FK → posts.id, NOT NULL | 저장된 게시물 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 저장 시각 |

제약조건: `UNIQUE(user_id, post_id)`

---

### 3.9 notifications (알림)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 알림 ID |
| receiver_id | INTEGER | FK → users.id, NOT NULL | 알림 수신자 |
| actor_id | INTEGER | FK → users.id, NOT NULL | 알림을 발생시킨 사용자 |
| type | VARCHAR(20) | NOT NULL | `like`, `comment`, `follow` 중 하나 (프런트 디자인에 `mention` 없음) |
| post_id | INTEGER | FK → posts.id, NULL | 관련 게시물(있는 경우) |
| comment_id | INTEGER | FK → comments.id, NULL | 관련 댓글(있는 경우) |
| is_read | BOOLEAN | DEFAULT FALSE | 읽음 여부 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 발생 시각 |

인덱스: `(receiver_id, created_at DESC)`, `(receiver_id, is_read)`

---

### 3.10 direct_threads (1:1 다이렉트 메시지 대화방)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 대화방 ID |
| user_a_id | INTEGER | FK → users.id, NOT NULL | 참여자 A (항상 `user_a_id < user_b_id`) |
| user_b_id | INTEGER | FK → users.id, NOT NULL | 참여자 B (항상 `user_a_id < user_b_id`) |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 생성일 |

제약조건: `UNIQUE(user_a_id, user_b_id)`, `CHECK(user_a_id < user_b_id)` — 그룹 채팅 없음, 두 사용자당 대화방 1개만 허용
외래키: 둘 다 ON DELETE CASCADE

---

### 3.11 direct_messages (다이렉트 메시지)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 메시지 ID |
| thread_id | INTEGER | FK → direct_threads.id, NOT NULL | 소속 대화방 |
| sender_id | INTEGER | FK → users.id, NOT NULL | 보낸 사람 |
| content | VARCHAR(1000) | NOT NULL | 메시지 본문 (텍스트 전용, 이미지 첨부는 Phase 2) |
| is_read | BOOLEAN | DEFAULT FALSE | 수신자 읽음 여부 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 전송 시각 |

외래키: `thread_id` ON DELETE CASCADE, `sender_id` ON DELETE CASCADE
인덱스: `(thread_id, created_at)`

---

## 4. 관계 요약

- `users` ↔ `posts`: 1:N (한 사용자는 여러 게시물 작성)
- `posts` ↔ `post_images`: 1:N (캐러셀 게시물 지원, 최소 1장)
- `users` ↔ `users` (follows 경유): N:M (자기참조)
- `users` ↔ `posts` (likes 경유): N:M
- `users` ↔ `posts` (saved_posts 경유): N:M
- `posts` ↔ `comments`: 1:N
- `comments` ↔ `comments` (parent_id 자기참조): 1:N (대댓글, depth 1단계로 제한 권장)
- `users` ↔ `users` (direct_threads 경유): N:M (1:1 대화방만 허용, 그룹 없음)
- `direct_threads` ↔ `direct_messages`: 1:N

---

## 5. 삭제 정책 (CASCADE 규칙)

- 사용자 삭제 시: 해당 사용자의 게시물, 댓글, 좋아요, 팔로우 관계, 알림, 대화방/메시지 모두 CASCADE 삭제
- 게시물 삭제 시: 게시물 이미지, 댓글, 좋아요, 저장 기록 모두 CASCADE 삭제
- 댓글 삭제 시: 대댓글, 댓글 좋아요 모두 CASCADE 삭제
- 실제 서비스 정책 고려 시 소프트 삭제(`is_deleted` 플래그)로 전환 가능 (Phase 2 고려사항)

---

## 6. 성능 고려사항

- 피드 조회: `posts.created_at DESC` + `follows.follower_id` 조인 최적화를 위해 복합 인덱스 검토
- 좋아요/댓글 수: 실시간 COUNT 대신 `posts` 테이블에 `like_count`, `comment_count` 비정규화 컬럼 캐싱 고려 (트래픽 증가 시 Phase 2)
- 개별 개발 환경과 프로덕션 환경 모두 SQLite를 계속 사용한다. 쓰기 동시성 이슈 완화를 위해 `PRAGMA journal_mode=WAL` 적용을 권장하며, 별도 DBMS(PostgreSQL 등)로의 마이그레이션은 계획하지 않는다.

---

## 7. 시드/초기 데이터

- 개발 환경에서 테스트용 사용자 8명, 게시물 24개, 팔로우 관계, 좋아요/댓글, 다이렉트 메시지 대화방(4개) 및 대화 내역 더미 데이터 생성 스크립트(`seed.py`) 제공 필요 (`frontend/src/mocks/data.ts`의 시드 구성을 참고)
