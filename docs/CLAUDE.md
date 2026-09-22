# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Instagram 클론 웹 애플리케이션. React(프론트엔드) + FastAPI(백엔드) + SQLite(DB) 구조의 모노레포이며, `frontend/`와 `backend/`가 각자 독립된 프로젝트로 존재한다(공유 워크스페이스 아님 — 각 디렉토리에서 따로 설치/실행).

상세 명세 문서 (구현 전 설계 문서지만 대부분 그대로 구현되어 있어 아키텍처 참고용으로 유효):
- `guide.md` — 전체 로드맵, 개발 순서, 코드 컨벤션
- `backend.md` — API 엔드포인트 전체 목록, 인증/보안 규칙, 에러 응답 포맷
- `front.md` — 라우트 구성, 화면별 요구사항, 상태관리 원칙
- `md.md` — DB 스키마(ERD), 각 테이블 컬럼/제약조건/인덱스

새 기능/엔드포인트/화면을 추가할 때는 먼저 해당 `.md` 문서에 이미 설계되어 있는지 확인하라. 설계와 다르게 구현할 경우 문서도 함께 갱신한다 (guide.md 8절 "문서 간 참조 관계" 참고).

## Commands

### Backend (`backend/`)
```bash
cd backend
python -m venv venv
venv\Scripts\activate                 # Windows
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head                  # DB 마이그레이션 적용
python seed.py                        # (선택) 더미 데이터 시딩
uvicorn app.main:app --reload --port 8000
```
- API 문서: `http://localhost:8000/docs` (Swagger), `/redoc`
- 새 마이그레이션 생성: `alembic revision --autogenerate -m "message"` (모델 변경 후 실행, 반드시 diff 확인)
- 테스트: `pytest` — 단, `backend/tests/`는 현재 비어 있음(테스트 미작성 상태). 테스트 요구사항은 backend.md 8절 참고.
- 린트: 별도 설정 파일 없음. guide.md는 `ruff` 사용을 권장하나 requirements.txt에는 포함되어 있지 않음.

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build         # tsc -b && vite build
npm run lint          # oxlint
npm run preview
```
- 단일 테스트 실행 명령 없음 — 테스트 프레임워크(Vitest)가 front.md에는 명시되어 있지만 package.json에는 아직 설치되어 있지 않다.
- dev 서버는 `/api`, `/static` 요청을 `http://127.0.0.1:8000`(백엔드)으로 프록시한다 (`vite.config.ts`). 프론트만 실행해도 백엔드가 8000 포트에서 떠 있어야 API 호출이 동작함.

## Architecture

### Backend — FastAPI + SQLAlchemy 2.x + Alembic + SQLite
- 계층 구조: `routers/`(API 엔드포인트) → `services/`(비즈니스 로직, 알림 생성 등) → `models/`(SQLAlchemy ORM) / `schemas/`(Pydantic DTO)
- `app/main.py`: 라우터 등록, CORS 설정(`settings.cors_origins_list`), `/static`에 업로드 디렉토리 마운트, `/api/health` 헬스체크
- `app/database.py`: SQLite 연결 시마다 `PRAGMA foreign_keys=ON` 강제 적용(FK 무결성이 기본으로 꺼져 있는 SQLite 특성 때문 — 모델에 FK를 추가해도 이 이벤트 리스너가 없으면 CASCADE가 동작하지 않음)
- `app/config.py`: `pydantic-settings` 기반, `.env`에서 로드. `DATABASE_URL`, `SECRET_KEY`, 토큰 만료 시간, `UPLOAD_DIR`, `CORS_ORIGINS` 관리
- 인증: JWT 기반 — Access Token(`sub`+`type:"access"`, 기본 30분)과 Refresh Token(`type:"refresh"`, 기본 14일)을 `app/core/security.py`에서 발급/검증. `app/core/dependencies.py`의 `get_current_user`가 `Authorization: Bearer` 헤더를 읽어 인증 필요 엔드포인트를 보호(`OAuth2PasswordBearer(auto_error=False)`로 커스텀 401 처리)
- 알림: 좋아요/댓글/팔로우 발생 시 `app/services/notifications.py`에서 알림 레코드 생성 (본인 행위에 대한 자기 알림은 제외)
- 이미지: `app/services/images.py`에서 업로드 검증/리사이즈(Pillow), 저장 경로는 `app/static/uploads`
- DB 스키마 원본은 `md.md` — 모든 PK는 `INTEGER PRIMARY KEY AUTOINCREMENT`, 대부분의 관계 테이블(likes, follows, saved_posts, comment_likes)에 `UNIQUE` 제약으로 중복 방지, 삭제는 CASCADE(사용자/게시물/댓글 삭제 시 하위 레코드 연쇄 삭제)
- API 응답 규칙: 페이지네이션은 피드/탐색/댓글은 커서 기반(`?cursor=&limit=`), 팔로워/팔로잉/검색은 오프셋 기반(`?page=&size=`); 에러는 `{"detail": ..., "error_code": ...}` 형식 (backend.md 5~6절)

### Frontend — React 19 + Vite + TypeScript
- 상태관리 이원화: 서버 상태는 전부 React Query(TanStack Query)로 관리하고, Zustand(`src/store/`)는 로그인 사용자 정보·UI 모달 상태 등 클라이언트 전역 상태만 담당한다. 서버 데이터를 Zustand에 중복 저장하지 않는다.
- 인증 흐름: Access Token은 메모리(Zustand `authStore`)에만 보관하고 절대 localStorage에 저장하지 않는다. Refresh Token은 HttpOnly 쿠키로 서버가 관리(`withCredentials: true`). `App.tsx`가 마운트 시 `/api/auth/refresh`를 호출해 세션을 복구(`bootstrap`)하고, `api/client.ts`의 axios 인터셉터가 401 응답을 가로채 자동으로 토큰을 갱신 후 원 요청을 재시도한다(동시 다발적 401에 대비해 `refreshPromise`로 갱신 요청을 단일화).
- 라우팅: `react-router-dom` v6 중첩 라우트. `/login`, `/signup`은 `GuestOnlyRoute`(로그인 시 리다이렉트), 나머지는 `ProtectedRoute`로 감싼 `AppLayout` 하위에 위치. 라우트 정의는 `App.tsx` 참고(front.md 3절의 라우트 표와 대응).
- 반응형: 데스크톱은 `Sidebar`, 모바일은 `MobileTabBar` — 둘 다 `AppLayout` 내부에서 Tailwind breakpoint로 분기.
- 개발 시 dev 서버(5173)가 백엔드(8000)로 `/api`, `/static`을 프록시하므로, axios `baseURL`은 상대 경로(`/api`)만 사용한다(`api/client.ts`).
