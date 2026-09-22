# 프론트엔드 명세서 (front.md)

## 1. 기술 스택

- 프레임워크: React 18 + Vite
- 언어: TypeScript
- 라우팅: React Router v6
- 상태관리: React Query(TanStack Query) — 서버 상태 / Zustand — 클라이언트 전역 상태(로그인 유저, 모달 등)
- 스타일링: Tailwind CSS
- 폼 처리: React Hook Form + Zod (유효성 검증)
- HTTP 클라이언트: Axios (인터셉터로 JWT 자동 첨부 및 401 시 리프레시 처리)
- 아이콘: lucide-react
- 테스트: Vitest + React Testing Library

---

## 2. 프로젝트 구조

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                    # axios 인스턴스 및 API 함수
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   ├── users.ts
│   │   ├── comments.ts
│   │   ├── notifications.ts
│   │   └── messages.ts
│   ├── components/
│   │   ├── common/              # Button, Avatar, Modal, Spinner 등
│   │   ├── post/                # PostCard, PostGrid, PostModal, ImageCarousel
│   │   ├── comment/              # CommentList, CommentItem, CommentInput
│   │   ├── message/              # ConversationList, ConversationItem, ChatWindow, MessageBubble, MessageInput
│   │   ├── layout/                # Sidebar, TopNav, MobileTabBar
│   │   └── profile/                # ProfileHeader, ProfileTabs
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── EditProfilePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── SavedPostsPage.tsx
│   │   └── MessagesPage.tsx
│   ├── hooks/                    # useAuth, useInfiniteFeed, useLikePost, useConversations, useMessages 등
│   ├── store/                    # zustand 스토어
│   ├── types/                    # 공통 TypeScript 타입 정의
│   ├── utils/                    # 날짜 포맷, 이미지 압축 등
│   └── router.tsx
├── public/
├── index.html
├── tailwind.config.ts
└── vite.config.ts
```

---

## 3. 라우트 구성

| 경로 | 페이지 | 인증 필요 | 설명 |
|---|---|---|---|
| `/login` | LoginPage | X | 로그인 |
| `/signup` | SignupPage | X | 회원가입 |
| `/` | FeedPage | O | 팔로잉 기반 피드 |
| `/explore` | ExplorePage | O | 탐색 탭 (그리드) |
| `/search` | SearchPage | O | 사용자 검색 |
| `/notifications` | NotificationsPage | O | 알림 목록 |
| `/saved` | SavedPostsPage | O | 저장한 게시물 |
| `/messages` | MessagesPage | O | 대화 목록 (데스크톱에서는 목록+채팅창 2단 레이아웃) |
| `/messages/:conversationId` | MessagesPage | O | 특정 대화 채팅창 (모바일에서는 전체 화면 전환) |
| `/:username` | ProfilePage | O | 프로필 (본인/타인 공통 컴포넌트, 소유 여부로 UI 분기) |
| `/:username/edit` | EditProfilePage | O (본인만) | 프로필 수정 |
| `/p/:postId` | PostDetailPage | O | 게시물 상세 (모달 또는 풀페이지) |

- 비인증 사용자가 보호된 라우트 접근 시 `/login`으로 리다이렉트 (`ProtectedRoute` 컴포넌트)
- 인증된 사용자가 `/login`, `/signup` 접근 시 `/`로 리다이렉트

---

## 4. 화면별 상세 요구사항

### 4.1 로그인/회원가입
- 로그인: username 또는 email + password
- 회원가입: username, email, password, password 확인 필드, 클라이언트 측 실시간 유효성 검증(Zod)
- 로그인 성공 시 Access Token은 메모리(Zustand)에, Refresh Token은 HttpOnly Cookie로 서버에서 관리

### 4.2 피드 페이지 (FeedPage)
- 팔로잉한 사용자들의 게시물을 최신순으로 무한 스크롤 표시 (React Query `useInfiniteQuery`)
- 각 게시물 카드: 작성자 아바타/유저네임, 이미지(캐러셀 지원, 좌우 스와이프/화살표), 좋아요/댓글/저장 버튼, 좋아요 수, 캡션(더보기 접기), 댓글 미리보기 2~3개, 작성 시간(상대 시간 표시: "3시간 전")
- 좋아요 더블탭(이미지 더블클릭) 지원, 낙관적 업데이트(Optimistic Update) 적용

### 4.3 탐색 페이지 (ExplorePage)
- 팔로우 여부와 무관한 게시물을 3열 그리드로 표시
- 그리드 아이템 hover 시 좋아요 수/댓글 수 오버레이 표시
- 클릭 시 PostDetailPage(모달)로 이동

### 4.4 프로필 페이지 (ProfilePage)
- 상단: 아바타, 유저네임, 풀네임, bio, 웹사이트 링크, 게시물 수/팔로워 수/팔로잉 수
- 본인 프로필: "프로필 편집" 버튼 표시
- 타인 프로필: "팔로우/언팔로우" 버튼 표시, 비공개 계정인데 팔로우하지 않은 경우 게시물 비노출("비공개 계정입니다" 안내)
- 하단: 게시물 3열 그리드 탭 / 저장됨 탭(본인만)

### 4.5 게시물 작성
- 상단 네비게이션 "만들기" 버튼 → 모달로 이미지 업로드(다중 선택, 드래그앤드롭 지원) → 캡션/위치 입력 → 게시
- 업로드 전 클라이언트 측 이미지 미리보기 및 순서 변경(캐러셀용) 지원

### 4.6 댓글
- 게시물 상세에서 댓글 목록 표시, 대댓글은 들여쓰기로 구분
- 댓글 좋아요, 댓글 작성자 본인 또는 게시물 작성자만 삭제 가능(UI에서 조건부 노출)

### 4.7 알림
- 좋아요/댓글/팔로우 알림을 시간순으로 표시, 읽지 않은 알림은 배경색으로 구분
- 상단 네비게이션에 읽지 않은 알림 개수 뱃지 표시

### 4.8 검색
- 입력 시 300ms 디바운스로 사용자 검색 API 호출, 유저네임/풀네임/아바타 표시

### 4.9 다이렉트 메시지 (MessagesPage)
- 백엔드 API/WebSocket 연동은 Phase 2 스트레치 목표(9절)로 남겨두되, UI/컴포넌트 구조는 아래와 같이 미리 설계한다.
- **레이아웃**
  - 데스크톱(≥1024px): 좌측 `ConversationList`(대화 상대 검색 포함) + 우측 `ChatWindow` 2단 레이아웃. 대화를 선택하지 않은 초기 상태는 우측에 빈 상태(placeholder) 표시
  - 모바일(<768px): `/messages`에서는 `ConversationList`만 전체 화면 표시, 대화 선택 시 `/messages/:conversationId`로 이동하며 `ChatWindow`가 전체 화면을 차지("뒤로가기"로 목록 복귀)
- **ConversationList / ConversationItem**
  - 상대방 아바타, 유저네임, 마지막 메시지 미리보기(1줄, 말줄임), 마지막 메시지 상대 시간, 안 읽은 메시지 개수 뱃지
  - 상단 "새 메시지" 버튼 → 팔로우 중인 사용자 검색 후 새 대화 시작
- **ChatWindow**
  - 상단: 상대방 아바타/유저네임 (클릭 시 프로필로 이동)
  - 메시지 영역: 본인 메시지는 우측 정렬 말풍선, 상대 메시지는 좌측 정렬 말풍선, 이미지 메시지 지원, 메시지 전송 시각은 hover 시 노출
  - 무한 스크롤(위로 스크롤 시 이전 메시지 로드, `useInfiniteQuery` 기반), 최초 진입 시 스크롤 최하단(최신 메시지) 고정
  - 상대방 "입력 중..." 타이핑 인디케이터 표시
- **MessageInput (Instagram 스타일 메시지 입력 UI)**
  - `ChatWindow` 하단 고정. 좌측부터: 이미지/사진 첨부 버튼(`lucide-react` 아이콘), 자동 높이 조절 텍스트 입력창(placeholder: "메시지 보내기..."), 이모지 선택 버튼, 텍스트 입력이 없을 때만 노출되는 우측 전송 버튼(텍스트 입력 시 "보내기" 텍스트 버튼으로 대체)
  - 키보드: `Enter`로 전송, `Shift+Enter`로 줄바꿈, 빈 문자열/공백만 있는 메시지는 전송 버튼 비활성화
  - 이미지 첨부 시 입력창 위에 미리보기 썸네일(개별 삭제 가능)이 붙고, 텍스트와 함께 또는 이미지 단독으로 전송 가능
  - 전송 시 낙관적 업데이트(Optimistic Update)로 즉시 본인 말풍선 렌더링 후 실제 전송 결과(성공/실패)로 상태 갱신, 실패 시 말풍선에 "재전송" 옵션 노출
  - 실시간 수신은 WebSocket 연결을 통해 반영(연결 훅: `useMessages` 내부에서 관리), 연결 끊김 시 폴링으로 폴백

---

## 5. 공통 컴포넌트 요구사항

- `Avatar`: 사이즈 prop(sm/md/lg), 기본 이미지 fallback
- `PostModal`: ESC/배경 클릭으로 닫기, URL과 동기화(`/p/:postId`)하여 새로고침 시에도 접근 가능
- `InfiniteScroll` 훅: IntersectionObserver 기반
- `ImageCarousel`: 좌우 스와이프(모바일), 화살표 버튼(데스크톱), 인디케이터 도트
- `MessageInput`: 자동 높이 조절 텍스트 영역, 이미지 첨부/이모지 버튼, `Enter` 전송·`Shift+Enter` 줄바꿈, 전송 중/실패 상태 표시 (4.9절 참고)
- 로딩 상태: 스켈레톤 UI 사용 (스피너 대신 콘텐츠 형태 유지)

---

## 6. 반응형 디자인

- 데스크톱(≥1024px): 좌측 고정 사이드바 네비게이션
- 모바일(<768px): 하단 탭 바 (홈/검색/만들기/알림/프로필)
- Tailwind 기본 breakpoint 사용 (`sm`, `md`, `lg`)

---

## 7. 상태관리 원칙

- 서버 데이터(게시물, 댓글, 프로필 등)는 React Query로만 관리, 캐시 무효화 전략 명시:
  - 좋아요/댓글 작성 시 해당 게시물 쿼리 무효화 또는 낙관적 업데이트
  - 팔로우/언팔로우 시 프로필 쿼리 및 피드 쿼리 무효화
- 클라이언트 전역 상태(Zustand)는 로그인 사용자 정보, 테마, 모달 열림 상태만 관리

---

## 8. 접근성 및 성능

- 이미지 `alt` 텍스트 필수 (캡션 기반 자동 생성)
- 이미지 lazy loading (`loading="lazy"`)
- 폼 요소에 `label` 연결, 키보드 네비게이션 지원
- 번들 최적화: 라우트 기반 코드 스플리팅(`React.lazy`)

---

## 9. Phase 2 (스트레치 목표)

- 다크 모드
- 실시간 DM 백엔드 연동 (WebSocket) — UI/컴포넌트 설계는 4.9절에 선반영, 실시간 송수신·읽음 처리 등 서버 연동만 스트레치 범위
- 스토리 뷰어 (원형 아바타 링, 자동 재생)
- 해시태그 페이지
