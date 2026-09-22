# 백엔드 개발 요청 명세서 (backend.md)

> 이 문서는 실제로 구현되어 있는 프런트엔드(현재는 `frontend/src/mocks`의 인메모리 mock API로 동작 중)를 기준으로 재정의되었습니다.
> **디자인(화면/컴포넌트/mock API)에 실제로 존재하는 기능과 그 기능에 필요한 데이터베이스만 구현 대상으로 삼습니다.** 화면에 자리만 있고 연결되지 않은 버튼(아바타 업로드, 게시물 수정/삭제 메뉴 등)은 8절 "제외 범위"에 명시하고 MVP API에서 제외했습니다.

> DB 스키마는 실제로 구축·검증되었고(4.3절), API 명세(5절)는 프런트엔드·DB와 대조 검증까지 마쳤다(5.8절). 다만 라우터 코드 자체(현재 `app/routers/*.py`는 전부 `501 Not Implemented` 스텁)는 아직 후속 작업이다.

## 1. 기술 스택

- 프레임워크: FastAPI (Python 3.11+)
- ORM: SQLAlchemy 2.x + Alembic (마이그레이션)
- DB: **SQLite3 (`instagram.db`) — 개별 개발 환경과 프로덕션 환경 모두 동일하게 SQLite를 사용한다.** (PostgreSQL 등으로의 마이그레이션은 고려하지 않음)
- 인증: JWT (Access Token + Refresh Token), `python-jose`, `passlib[bcrypt]`
- 유효성 검증: Pydantic v2
- 파일 업로드: `python-multipart`, 이미지 저장은 로컬 `/uploads` 디렉토리
- 이미지 처리: Pillow (썸네일 리사이즈, 포맷 검증)
- 비동기 서버: Uvicorn
- 테스트: pytest + httpx (AsyncClient)
- 문서화: FastAPI 자동 생성 Swagger(`/docs`), ReDoc(`/redoc`)

### SQLite 프로덕션 운용 참고
- `PRAGMA journal_mode=WAL` 적용 권장 (읽기와 쓰기 동시성 개선)
- `PRAGMA foreign_keys=ON`은 연결마다 강제 적용 (이미 `app/database.py`에 구현됨)
- 단일 파일 DB이므로 정기 백업(파일 복사)만으로 백업 전략 충분

---

## 2. 프로젝트 구조

```
backend/
├── app/
│   ├── main.py                 # FastAPI 앱 엔트리포인트
│   ├── config.py                # 환경설정 (Pydantic Settings)
│   ├── database.py              # SQLAlchemy 세션/엔진
│   ├── models/                  # SQLAlchemy 모델
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   ├── follow.py
│   │   ├── notification.py
│   │   ├── saved_post.py
│   │   └── direct_message.py    # (신규) DirectThread, DirectMessage
│   ├── schemas/                 # Pydantic 스키마 (요청/응답 DTO)
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── auth.py
│   │   └── direct_message.py    # (신규)
│   ├── routers/                 # API 라우터
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   ├── comments.py
│   │   ├── follows.py
│   │   ├── notifications.py
│   │   ├── search.py
│   │   └── direct_messages.py   # (신규)
│   ├── services/                # 비즈니스 로직
│   ├── core/
│   │   ├── security.py          # 비밀번호 해싱, JWT 발급/검증
│   │   └── dependencies.py      # get_current_user, get_current_user_optional
│   └── static/uploads/          # 업로드 이미지 저장 경로
├── alembic/                      # 마이그레이션 스크립트
├── tests/
├── requirements.txt
├── seed.py                       # 더미 데이터 시딩
└── .env.example
```

---

## 3. 인증 및 보안

- 비밀번호: bcrypt 해싱 후 저장, 평문 저장 금지
- JWT Access Token: 만료 30분, Refresh Token: 만료 14일 (HttpOnly Cookie, `path=/api/auth`)
- CORS: 프론트엔드 개발 서버 origin(`http://localhost:5173`) 허용
- 업로드 파일: 확장자(jpg, jpeg, png, webp) 및 MIME 타입 검증, 최대 용량 10MB 제한
- SQL Injection 방지: SQLAlchemy ORM/파라미터 바인딩만 사용, raw query 지양
- 입력값 검증: Pydantic 스키마에서 길이 제한(caption 2200자, bio 150자, comment 500자, location 100자, DM 메시지 1000자 등, `db.md` 컬럼 타입과 동일) 강제

### 3.1 인증 의존성 두 종류 (★ 기존 명세 대비 핵심 변경점)

프런트엔드 라우팅(`router.tsx`)을 보면 피드 `/`, 탐색 `/explore`, 검색 `/search`, 게시물 상세 `/p/:postId`, 프로필 `/:username`은 **비로그인 게스트도 조회 가능**하고, 좋아요/댓글/저장/팔로우/게시물 작성 등 "쓰기" 동작에서만 로그인을 요구한다(`useRequireAuth` 훅으로 미로그인 시 `/login`으로 리다이렉트, `GuestBanner` 노출). 따라서 의존성을 두 가지로 분리한다.

- `get_current_user`: 토큰 없거나 무효하면 401. 쓰기 동작(좋아요/댓글/팔로우/저장/게시물 작성/삭제/알림/DM/프로필 수정)에 사용.
- `get_current_user_optional`: 토큰이 없으면 `None`을 반환(에러 아님), 있으면 검증 후 사용자 반환. 조회 전용 엔드포인트(피드/탐색/게시물 상세/프로필/게시물 목록/댓글 목록/검색/팔로워·팔로잉 목록)에 사용하며, 로그인 사용자에게는 `is_liked`/`is_saved`/`is_following` 등 개인화 필드를 채우고 게스트에게는 `false`로 내려준다.

---

## 4. 데이터 모델 요약 (기존 `db.md` 대비 변경분)

기본 테이블(`users`, `posts`, `post_images`, `follows`, `likes`, `comments`, `comment_likes`, `saved_posts`)은 `db.md`를 그대로 따른다. 아래 두 가지만 변경한다.

### 4.1 `notifications.type` 값 축소
- 기존: `like`, `comment`, `follow`, `mention`
- 변경: **`like`, `comment`, `follow` 3종만 사용** (`mention`은 프런트 타입 정의·화면 어디에도 없음 → 제거)

### 4.2 다이렉트 메시지 테이블 신규 추가

DM은 프런트에서 실제로 동작하는 기능이므로(단순 UI 목업이 아님) MVP 범위에 포함한다.

**direct_threads (1:1 대화방)**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 대화방 ID |
| user_a_id | INTEGER | FK → users.id, NOT NULL | 참여자 A (항상 `user_a_id < user_b_id`) |
| user_b_id | INTEGER | FK → users.id, NOT NULL | 참여자 B (항상 `user_a_id < user_b_id`) |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 생성일 |

제약조건: `UNIQUE(user_a_id, user_b_id)`, `CHECK(user_a_id < user_b_id)` — 동일 두 사용자 간 중복 대화방 방지(1:1 전용, 그룹 채팅 없음)
외래키: 둘 다 ON DELETE CASCADE

**direct_messages**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 메시지 ID |
| thread_id | INTEGER | FK → direct_threads.id, NOT NULL | 소속 대화방 |
| sender_id | INTEGER | FK → users.id, NOT NULL | 보낸 사람 |
| content | VARCHAR(1000) | NOT NULL | 메시지 본문 (텍스트 전용, 이미지 첨부 없음) |
| is_read | BOOLEAN | ORM DEFAULT FALSE, NOT NULL | 수신자가 읽었는지 여부 |
| created_at | DATETIME | ORM DEFAULT 현재 UTC, NOT NULL | 전송 시각 |

외래키: `thread_id` ON DELETE CASCADE, `sender_id` ON DELETE CASCADE
인덱스: `(thread_id, created_at)` — 메시지 목록/최신 메시지 조회용

`db.md`에도 이 두 테이블과 notifications.type 제약을 반영한다(guide.md 8절 "문서 간 참조 관계" 규칙).

### 4.3 데이터베이스 검토 결과 (2026-09-18)

- SQLAlchemy 모델과 Alembic 후속 마이그레이션에 `direct_threads`, `direct_messages`를 추가했다. 두 참여자 ID는 `user_a_id < user_b_id`로 정규화해 같은 두 사용자 사이의 대화방 중복을 DB에서 막는다.
- `direct_messages`에는 `(thread_id, created_at)` 인덱스를 추가했다. 대화방 메시지 시간순 조회를 위한 인덱스이며, 메시지는 대화방 삭제 시 함께 삭제된다.
- `notifications.type`에 `CHECK (type IN ('like', 'comment', 'follow'))`를 추가했다. 프론트 타입과 문서에 없는 `mention` 등 임의 값이 저장되지 않는다.
- 모든 외래키에는 `ON DELETE CASCADE`를 유지한다. 사용자, 게시물, 댓글, 대화방 삭제 시 종속 데이터가 고아 레코드로 남지 않는다.
- 모델의 날짜/불리언 기본값은 현재 ORM 레벨 기본값이다. SQLite가 직접 `CURRENT_TIMESTAMP`를 적용하는 서버 기본값으로 문서화하지 않는다.
- SQLite의 정수 PK는 현재 `INTEGER PRIMARY KEY`이며, 명시적 SQLite `AUTOINCREMENT`는 사용하지 않는다. 삭제된 ID의 재사용 방지가 요구될 때만 별도 마이그레이션으로 도입한다.
- `comments.parent_id`가 다른 게시물의 댓글을 가리키는 문제와 대댓글 깊이 제한은 단일 컬럼 FK만으로 표현할 수 없으므로 후속 쓰기 로직/검증에서 처리한다.
- 개발 시드 데이터는 프론트 mock 구성과 맞춰 사용자 8명, 게시물 24개, 1:1 DM 대화방 4개를 생성하도록 정리했다.

---

## 5. API 엔드포인트 명세

인증 컬럼: **O** = 필수 로그인, **△** = 선택(비로그인도 조회 가능, 로그인 시 개인화 필드 채움), **X** = 불필요

### 5.1 인증 (`/api/auth`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | `/api/auth/signup` | 회원가입 (username, email, password) | X |
| POST | `/api/auth/login` | 로그인 (`username_or_email` + password), JWT 발급 | X |
| POST | `/api/auth/refresh` | Access Token 재발급 (Refresh Token 쿠키 필요) | Refresh Token |
| POST | `/api/auth/logout` | 로그아웃 (Refresh Token 쿠키 삭제) | O |
| GET | `/api/auth/me` | 현재 로그인 사용자 정보(email 포함) | O |

### 5.2 사용자 (`/api/users`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/users/{username}` | 프로필 조회 (게시물 수/팔로워/팔로잉 수, `is_following` 포함) | △ |
| PATCH | `/api/users/me` | 내 프로필 수정 (`full_name`, `bio`, `website`, `is_private`) | O |
| GET | `/api/users/{username}/posts` | 특정 사용자의 게시물 목록 (커서 페이지네이션) | △ |
| GET | `/api/users/{username}/followers` | 해당 사용자를 팔로우하는 사람 목록 | △ |
| GET | `/api/users/{username}/following` | 해당 사용자가 팔로우하는 사람 목록 | △ |
| GET | `/api/search/users?q=` | 사용자 이름/유저네임 검색 | △ |

> `followers`/`following`은 **URL의 `{username}` 사용자를 기준**으로 정확히 계산한다(로그인한 "나"의 목록이 아님).

### 5.3 팔로우 (`/api/follows`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | `/api/follows/{username}` | 팔로우 (자기 자신 팔로우 방지, 중복 시 idempotent) | O |
| DELETE | `/api/follows/{username}` | 언팔로우 | O |

### 5.4 게시물 (`/api/posts`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/posts/feed` | 피드. **로그인 시** 팔로잉+본인 게시물 최신순, **게스트 시** 전체 게시물 최신순(공개 피드) — 단, 비공개 계정 게시물은 제외(아래 불릿 참고) | △ |
| GET | `/api/posts/explore` | 탐색 탭, 좋아요 수 내림차순(동률 시 최신순) — 비공개 계정 게시물 제외 | △ |
| POST | `/api/posts` | 게시물 작성 (이미지 1장 이상 다중 업로드 + caption + location) | O |
| GET | `/api/posts/{post_id}` | 게시물 상세 조회 — 작성자가 비공개 계정이고 조회자가 본인/팔로워가 아니면 404 | △ |
| DELETE | `/api/posts/{post_id}` | 게시물 삭제 | O (작성자만) |
| POST | `/api/posts/{post_id}/like` | 좋아요 | O |
| DELETE | `/api/posts/{post_id}/like` | 좋아요 취소 | O |
| POST | `/api/posts/{post_id}/save` | 게시물 저장(북마크) | O |
| DELETE | `/api/posts/{post_id}/save` | 저장 취소 | O |
| GET | `/api/posts/saved` | 내가 저장한 게시물 목록 | O |

- 게시물 작성 시 caption 없이 이미지만으로도 작성 가능해야 한다(캡션 필수 아님). 이미지는 필수(최소 1장).
- **비공개 계정 게시물 필터링**: `EditProfilePage`의 안내 문구("비공개 계정: 팔로워만 게시물을 볼 수 있습니다")대로 `is_private=true`인 작성자의 게시물은 작성자 본인이거나 그를 팔로우하는 조회자에게만 노출한다. `GET /posts/feed`(게스트/비팔로잉 조회), `GET /posts/explore`, `GET /posts/{post_id}`, `GET /users/{username}/posts` 4곳 모두 이 필터를 동일하게 적용해야 한다(그렇지 않으면 `ProfilePage`에서는 가려지는 게시물이 탐색 탭이나 직접 링크로는 새어나간다). 반면 팔로워/팔로잉 "목록"과 프로필 기본 정보(자기소개 등)는 안내 문구에 언급이 없으므로 잠그지 않는다.

### 5.5 댓글 (`/api/posts/{post_id}/comments`, `/api/comments`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/posts/{post_id}/comments` | 최상위 댓글 목록(각 댓글에 1단계 대댓글 `replies` 포함), 커서 페이지네이션 | △ |
| POST | `/api/posts/{post_id}/comments` | 댓글 작성 (`parent_id`로 대댓글 지정, 깊이는 1단계로 제한) | O |
| DELETE | `/api/comments/{comment_id}` | 댓글 삭제 (작성자 본인 또는 게시물 작성자만 가능, 대댓글도 함께 삭제) | O |
| POST | `/api/comments/{comment_id}/like` | 댓글 좋아요 (멱등 — 이미 좋아요 상태면 무시) | O |

### 5.6 알림 (`/api/notifications`)

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/notifications` | 알림 목록 (커서 페이지네이션) | O |
| GET | `/api/notifications/unread-count` | 안 읽은 알림 개수 | O |
| PATCH | `/api/notifications/{id}/read` | 알림 읽음 처리 | O |
| PATCH | `/api/notifications/read-all` | 전체 읽음 처리 | O |

### 5.7 다이렉트 메시지 (`/api/direct`) — 신규

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/direct/threads` | 내 대화방 목록 (최근 메시지순, 클라이언트가 5초 간격 폴링) | O |
| GET | `/api/direct/threads/unread-count` | 안 읽은 메시지가 있는 **대화방 개수**(메시지 총합 아님) | O |
| POST | `/api/direct/threads` | 특정 유저와의 대화방 시작(이미 있으면 기존 대화방 반환, upsert) | O |
| GET | `/api/direct/threads/{thread_id}` | 대화방 상세 + 메시지 전체(조회 시 상대가 보낸 메시지를 읽음 처리), 클라이언트가 2초 간격 폴링 | O |
| POST | `/api/direct/threads/{thread_id}/messages` | 메시지 전송(텍스트 전용) | O |

- 대화 상대는 팔로우 여부와 무관하게 아무 사용자나 검색해서 시작할 수 있다(front.md의 "팔로우 중인 사용자만" 제약은 실제 구현과 다르므로 따르지 않는다).
- WebSocket, 이미지 첨부, 실시간 "입력 중..." 프레즌스는 이번 범위에 포함하지 않는다(8절 참고).
- 요청자가 대화방의 참여자(`user_a_id` 또는 `user_b_id`)가 아니면 `GET/POST /api/direct/threads/{thread_id}...`는 403을 반환한다.

### 5.8 관리자 (`/api/admin`) — 신규

`users.is_admin=true`인 계정만 접근 가능(`get_current_admin` 의존성, 위반 시 403). 관리자 계정은 회원가입 API가 아니라 `seed.py`의 `ensure_admin_user()`로 생성한다(username `admin` / password `pass123`).

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/admin/stats` | 통계 대시보드: 전체/활성/탈퇴 회원 수, 오늘 신규 가입, 게시물/댓글/좋아요/팔로우/DM 총계, 최근 14일 일별 가입자 수, 좋아요 TOP 5 게시물 | 관리자 |
| GET | `/api/admin/users?page=&size=&q=` | 전체 회원 목록(가입일 포함), `q`로 아이디/이메일 검색, 오프셋 페이지네이션(`page/size/total/total_pages`) | 관리자 |
| DELETE | `/api/admin/users/{user_id}` | 회원 탈퇴 처리 — 하드 삭제가 아니라 `is_active=false`로 소프트 삭제(연쇄 삭제 방지, 로그인 즉시 차단). 관리자 본인은 탈퇴 불가(422) | 관리자 |
| GET | `/api/admin/posts?page=&size=` | 전체 게시물 목록(작성자 무관, 최신순), 오프셋 페이지네이션 | 관리자 |

- 게시물 삭제는 별도 엔드포인트를 만들지 않고 기존 `DELETE /api/posts/{post_id}`를 재사용한다 — 작성자 본인이거나 `is_admin=true`면 삭제 가능하도록 조건만 확장했다.
- `POST /api/auth/login`은 `is_active=false`(탈퇴 처리된) 계정이면 비밀번호가 맞아도 401을 반환하도록 수정했다(이전에는 로그인 자체는 허용되고 이후 요청에서만 막혔음).

### 5.9 API 명세 검증 결과 (2026-09-18)

완성된 프런트엔드 페이지 전체(`frontend/src/api`, `pages`, `components`, `hooks`)와 지금 구축된 SQLite 스키마를 다시 대조해 5절을 아래와 같이 확정했다.

- **누락된 엔드포인트 없음**: `frontend/src/api/*.ts`의 mock 함수 전부(인증 5개, 사용자 7개, 팔로우 2개, 게시물 10개, 댓글 4개, 알림 4개, DM 5개)가 5.1~5.7의 엔드포인트와 1:1로 대응함을 확인했다.
- **제거**: `Post.comments_preview` 필드는 타입 정의와 `PostCard.tsx` 렌더링 분기만 있을 뿐 `mocks/data.ts`·`api/posts.ts` 어디에서도 값을 채우지 않는 죽은 코드였다. 이전 버전에 있던 "피드/상세 응답에 댓글 미리보기 2개 포함" 요구사항은 실제 디자인에 존재하지 않는 기능이므로 제거했다(N+1 서브쿼리 비용도 함께 제거됨).
- **단순화**: `GET /api/search/users`는 `SearchPage`/`NewMessageModal` 어디서도 페이지네이션을 사용하지 않아 커서/오프셋 방식 대신 배열을 그대로 반환하도록 6절을 수정했다.
- **추가(DB와 불일치 수정)**: `users.is_private`는 `ProfilePage`에서 게시물 그리드만 잠그는데, 기존 명세의 `feed`/`explore`/`{post_id}`/`{username}/posts`에는 이 필터가 전혀 없어 비공개 계정 게시물이 새어나갈 수 있었다. 4곳 모두에 동일한 비공개 필터를 명시했다(5.4절 불릿).
- **범위 확인**: `SuggestedUsers` 컴포넌트는 별도 추천 엔드포인트 없이 `GET /users/haru_lee/followers`를 하드코딩 호출한다. 새 엔드포인트는 필요 없지만, 이는 시드 데이터에 의존하는 임시 목업 로직이며 실제 추천 알고리즘이 아니라는 점을 남겨둔다(추후 실제 추천 로직으로 교체 시 별도 엔드포인트 설계 필요).
- **DB 매칭 확인**: 그 외 모든 엔드포인트의 요청/응답 필드가 `db.md`의 컬럼과 정확히 일치함을 확인했다(예: `PATCH /users/me`↔`users.full_name/bio/website/is_private`, `POST /posts`↔`posts`+`post_images`, `POST /direct/threads/{id}/messages`↔`direct_messages.content` VARCHAR(1000)).

---

## 6. 페이지네이션 규칙

- 피드/탐색/게시물 목록/댓글 목록: 커서 기반 페이지네이션 (`?cursor=&limit=`)
- 팔로워/팔로잉: 오프셋 기반 페이지네이션 (`?page=1&size=20`)
- 공통 응답 형식(위 두 경우):
```json
{
  "items": [...],
  "next_cursor": "123",
  "has_more": true
}
```
- `GET /api/search/users?q=`는 페이지네이션 없이 **일치하는 사용자 배열을 그대로 반환**한다(`SearchPage`, `NewMessageModal` 모두 `next_cursor`/`page`를 사용하지 않음). 응답 크기 보호를 위해 서버에서 결과를 최대 20건으로 제한한다.

---

## 7. 에러 응답 표준

```json
{
  "detail": "에러 메시지",
  "error_code": "USER_NOT_FOUND"
}
```

- 401: 인증 실패/토큰 만료
- 403: 권한 없음 (타인 게시물/댓글 삭제 시도 등)
- 404: 리소스 없음
- 409: 중복 (username/email 중복 등)
- 422: 유효성 검증 실패 (FastAPI 기본 처리)

---

## 8. 제외 범위 (프런트엔드 디자인에 없거나 연결되지 않은 기능)

다음은 화면/컴포넌트가 없거나, 버튼은 있지만 실제 동작(mock 함수 호출)으로 연결되어 있지 않아 이번 백엔드 구현 범위에서 **제외**한다. 추후 프런트에서 실제로 연결되면 그때 API를 추가한다.

- **프로필 아바타 업로드** (`EditProfilePage`의 "사진 변경" 버튼은 클릭 핸들러 없음)
- **게시물 수정 (caption/location PATCH)** — 프런트에 수정 UI/함수 자체가 없음
- **댓글 좋아요 취소(unlike)** — `CommentItem`은 좋아요만 호출하고 취소 API는 호출하지 않음
- **알림 타입 `mention`**
- **DM 이미지 첨부, 실시간 WebSocket, "입력 중..." 프레즌스, 자동 응답** — 현재 프런트의 타이핑 인디케이터·자동 답장은 백엔드 부재 상태에서 화면을 시연하기 위한 mock 전용 연출이며 실제 서버가 흉내 낼 기능이 아니다. 실시간성이 필요해지면 Phase 2에서 WebSocket으로 별도 설계한다.
- 스토리(Story), 해시태그 검색, 게시물 신고/차단, 다크모드 — 기존과 동일하게 범위 밖

---

## 9. 알림 생성 트리거

- 좋아요 발생 시 게시물 작성자에게 `like` 알림 생성 (본인 게시물 좋아요 시 제외)
- 댓글 작성 시 게시물 작성자에게 `comment` 알림 생성 (본인 게시물에 본인이 댓글 작성 시 제외)
- 팔로우 시 대상 사용자에게 `follow` 알림 생성
- 알림 생성은 서비스 레이어에서 처리, 트랜잭션 실패 시 알림도 롤백

---

## 10. 테스트 요구사항

- 인증 플로우(회원가입/로그인/토큰 재발급) 단위 테스트
- 게스트(비로그인) 접근 시 조회 엔드포인트는 200, 쓰기 엔드포인트는 401 반환 확인
- 게시물 CRUD 및 권한 검증(타인 게시물 삭제 차단) 테스트
- 좋아요/댓글/저장 중복 방지(멱등) 테스트
- 팔로우/언팔로우 및 자기 자신 팔로우 방지 테스트
- 팔로워/팔로잉 목록이 대상 사용자 기준으로 정확히 반환되는지 테스트
- DM: 동일 상대와 중복 대화방이 생성되지 않는지, 대화방 조회 시 상대 메시지가 읽음 처리되는지 테스트
- 최소 커버리지 목표: 핵심 라우터 70% 이상

---

## 11. 환경 변수 (`.env`)

```
DATABASE_URL=sqlite:///./instagram.db
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=14
UPLOAD_DIR=./app/static/uploads
CORS_ORIGINS=http://localhost:5173
```

개별 개발 환경과 프로덕션 환경에서 `DATABASE_URL`만 다른 SQLite 파일 경로를 가리키도록 하고(예: `./instagram.db` vs `./data/instagram.prod.db`), DB 엔진 자체는 변경하지 않는다.

---

## 12. Phase 2 (스트레치 목표, 이번 MVP 범위 아님)

- DM 실시간 송수신(WebSocket), 이미지 메시지, 실시간 "입력 중..." 프레즌스
- 스토리(Story) 기능, 24시간 자동 만료
- 해시태그 검색 및 인기 태그
- 게시물 신고/차단 기능
- 게시물 수정, 프로필 아바타 업로드, 댓글 좋아요 취소
- 이미지 CDN/오브젝트 스토리지 연동
