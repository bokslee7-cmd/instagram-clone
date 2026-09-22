# 전체 프로젝트 가이드 (guide.md)

## 1. 프로젝트 개요

- 목표: 완전한 기능의 Instagram 클론 웹 애플리케이션 개발
- 기술 스택: React(프론트엔드) + FastAPI(백엔드) + SQLite(데이터베이스)
- 관련 문서:
  - [front.md](./front.md) — 프론트엔드 상세 명세
  - [backend.md](./backend.md) — 백엔드 API 및 아키텍처 명세
  - [db.md](./db.md) — 데이터베이스 스키마 설계

---

## 2. 리포지토리 구조

```
my_instagram2/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + SQLAlchemy + SQLite
├── front.md
├── backend.md
├── db.md
└── guide.md
```

---

## 3. 개발 환경 세팅

### 3.0 원클릭 실행 (Windows, 권장)

프로젝트 루트의 `start.bat`을 더블클릭하거나 실행하면 아래 과정이 모두 자동으로 처리됩니다:

1. 백엔드 가상환경 생성 및 `requirements.txt` 설치, `.env` 생성
2. Alembic 마이그레이션 적용(`alembic upgrade head`) 및 시드 데이터 생성(`seed.py`, 이미 데이터가 있으면 건너뜀)
3. 백엔드(uvicorn, :8000)·프론트엔드(vite, :5173)를 각각 새 콘솔 창에서 실행
4. 프론트엔드가 응답할 때까지 대기 후 기본 브라우저로 `http://localhost:5173` 자동 오픈

```
start.bat
```

Python·Node.js가 PATH에 설치되어 있어야 하며, 이후 재실행 시에는 이미 설치된 의존성은 건너뛰고 서버만 빠르게 재기동합니다. 서버를 종료하려면 새로 열린 두 개의 콘솔 창을 닫으면 됩니다. 아래 3.1~3.3은 수동으로 단계별 실행하거나 문제를 진단할 때 참고합니다.

### 3.1 백엔드
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head            # DB 마이그레이션
python seed.py                  # (선택) 더미 데이터 생성
uvicorn app.main:app --reload --port 8000
```

### 3.2 프론트엔드
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

### 3.3 API 문서 확인
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 4. 개발 순서 (권장 로드맵)

### Phase 0 — 기반 작업
1. 백엔드: FastAPI 프로젝트 스캐폴딩, SQLAlchemy 모델 정의 (md.md 기준)
2. 백엔드: Alembic 초기 마이그레이션 생성
3. 프론트엔드: Vite + React + TS + Tailwind 프로젝트 초기화

### Phase 1 — 인증
1. 백엔드: 회원가입/로그인/JWT 발급 API
2. 프론트엔드: 로그인/회원가입 페이지, ProtectedRoute, axios 인터셉터

### Phase 2 — 프로필 & 팔로우
1. 백엔드: 프로필 조회/수정, 팔로우/언팔로우 API
2. 프론트엔드: ProfilePage, EditProfilePage, 팔로우 버튼

### Phase 3 — 게시물 핵심 기능
1. 백엔드: 게시물 CRUD, 이미지 업로드, 좋아요 API
2. 프론트엔드: 게시물 작성 모달, PostCard, 피드 무한 스크롤

### Phase 4 — 댓글 & 상호작용
1. 백엔드: 댓글/대댓글, 댓글 좋아요 API
2. 프론트엔드: 댓글 목록/작성 UI, PostDetailPage(모달)

### Phase 5 — 탐색 & 검색 & 알림
1. 백엔드: 탐색 피드, 사용자 검색, 알림 생성/조회 API
2. 프론트엔드: ExplorePage, SearchPage, NotificationsPage

### Phase 6 — 마무리
1. 저장(북마크) 기능
2. 반응형 UI 점검 (모바일/데스크톱)
3. 테스트 작성 및 커버리지 점검
4. 배포 준비 (환경변수 정리, 빌드 스크립트)

> Phase 2(스트레치) 항목인 DM, 스토리, 해시태그 등은 위 로드맵 완료 후 별도 착수

---

## 5. 코드 컨벤션

- 백엔드: PEP8, `ruff`로 린팅, 함수/변수는 snake_case
- 프론트엔드: ESLint + Prettier, 컴포넌트는 PascalCase, 훅은 `use` 접두사
- 커밋 메시지: Conventional Commits 형식 권장 (`feat:`, `fix:`, `refactor:` 등)
- API 응답/요청 필드명: snake_case로 통일 (백엔드 Pydantic 기준), 프론트엔드에서 필요 시 변환

---
  
## 6. 통합 테스트 체크리스트

- [ ] 회원가입 → 로그인 → 토큰 저장까지 전체 플로우
- [ ] 게시물 작성(이미지 포함) → 피드에 즉시 반영
- [ ] 좋아요/댓글 작성 시 알림이 상대방에게 생성되는지
- [ ] 팔로우 후 피드에 해당 사용자 게시물이 노출되는지
- [ ] 비공개 계정 팔로우 전 게시물 비노출 확인
- [ ] 타인 게시물/댓글 삭제 시도 시 403 반환 확인
- [ ] 모바일 뷰에서 하단 탭 바 및 반응형 레이아웃 확인

---

## 7. 배포 고려사항 (참고용)

- 백엔드: SQLite는 단일 파일 DB이므로 소규모 배포(Render, Fly.io, 자체 VPS)에 적합. 트래픽 증가 시 PostgreSQL 마이그레이션 경로 고려
- 프론트엔드: Vite 빌드 후 정적 호스팅(Vercel, Netlify) 또는 백엔드와 함께 Nginx로 서빙
- 업로드 이미지: 초기에는 로컬 디스크, 확장 시 S3 호환 스토리지로 교체 (backend.md의 UPLOAD_DIR 설정 참고)
- 환경변수는 `.env` 파일로 관리하며 저장소에 커밋하지 않음 (`.env.example`만 포함)

---

## 8. 문서 간 참조 관계

- API 엔드포인트 설계 변경 시 → `backend.md`와 `front.md`의 API 연동 부분 함께 갱신
- DB 스키마 변경 시 → `md.md` 갱신 후 Alembic 마이그레이션 생성, `backend.md`의 모델/스키마 반영
- 새로운 화면/기능 추가 시 → `front.md`에 라우트/컴포넌트 명세 추가 후 이 가이드의 로드맵에 반영
