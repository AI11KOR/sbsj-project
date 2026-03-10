# 🏪 상부상조 (SBSJ) - 서울시 상권분석 플랫폼

> 대구 AI 개발교육 1조 | 팀 프로젝트

AI 기반 서울시 상권 분석 및 창업 입지 추천 서비스입니다.  
카카오맵과 머신러닝 예측 모델을 활용하여 업종별 상권 점수를 시각화하고, RAG 챗봇을 통해 창업 관련 질문에 실시간으로 답변합니다.

---

## 📌 주요 기능

| 기능 | 설명 |
|------|------|
| 🗺️ 지도 기반 상권 분석 | 카카오맵 위에 서울시 행정동별 상권 점수 시각화 |
| 📊 업종별 창업 적합도 예측 | 카페 / 한식 / 호프 3개 업종의 입지 점수 예측 (XGBoost, LightGBM) |
| 🤖 RAG 챗봇 | 상권 관련 문서 기반 AI 챗봇 (GPT-4o-mini + ChromaDB) |
| 🔍 MCP 외부 도구 연동 | 로컬 문서로 부족한 경우 Tavily / Brave 검색 자동 호출 |
| 👤 회원 시스템 | JWT 인증, 소셜 로그인 (Google, Kakao, Naver) |
| 📧 이메일 인증 | Nodemailer 기반 이메일 발송 |
| ☁️ 파일 업로드 | AWS S3 연동 이미지/파일 업로드 |

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                    │
│               Next.js 16 (Port 3000)                │
└────────────┬───────────────────────────┬────────────┘
             │                           │
    ┌────────▼────────┐       ┌──────────▼──────────┐
    │  Backend API    │       │    RAG Chatbot API   │
    │  Express + TS   │       │   FastAPI (Port 8001) │
    │  (Port 8000)    │       │  ChromaDB + GPT-4o   │
    │  Prisma + MySQL │       │  MCP (Tavily/Brave)  │
    └─────────────────┘       └─────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │     AI Server        │
                              │  Flask (Port 5000)   │
                              │  XGBoost / LightGBM  │
                              │  서울시 상권 예측     │
                              └─────────────────────┘
```

---

## 🛠️ 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.0.0 | 프론트엔드 프레임워크 (App Router) |
| React | 19.2.0 | UI 라이브러리 |
| TypeScript | ^5 | 정적 타입 |
| Tailwind CSS | ^4.1.9 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 |
| Zustand | ^5.0.8 | 전역 상태 관리 |
| React Hook Form + Zod | - | 폼 유효성 검사 |
| Kakao Maps API | - | 지도 시각화 |
| Recharts | - | 데이터 차트 |
| Axios | ^1.13.2 | HTTP 통신 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js + Express | ^5.1.0 | REST API 서버 |
| TypeScript | ^5 | 정적 타입 |
| Prisma | ^6.19.0 | ORM (DB 연동) |
| MySQL | - | 관계형 데이터베이스 |
| JWT | ^9.0.2 | 인증 토큰 |
| Passport.js | - | 소셜 로그인 (Google/Kakao/Naver) |
| AWS S3 + Multer | - | 파일 업로드 |
| Nodemailer | - | 이메일 발송 |
| Swagger | - | API 문서 자동화 |
| Cheerio | - | 웹 스크래핑 |

### AI Server
| 기술 | 버전 | 용도 |
|------|------|------|
| Python + Flask | - | AI API 서버 |
| XGBoost | - | 업종별 상권 점수 예측 |
| LightGBM | - | 그룹 정규화 기반 예측 |
| scikit-learn | 1.7.2 | 데이터 전처리 / 모델 평가 |
| pandas | - | 데이터 처리 |
| pyproj | - | 좌표계 변환 (EPSG:4326 → EPSG:5179) |
| joblib | - | 모델 직렬화 |

### RAG Chatbot
| 기술 | 버전 | 용도 |
|------|------|------|
| Python + FastAPI | 0.115.12 | 챗봇 API 서버 |
| OpenAI GPT-4o-mini | - | 언어 모델 |
| ChromaDB | 0.5.23 | 벡터 데이터베이스 |
| sentence-transformers | - | BGE-M3-KO 임베딩 모델 |
| FastMCP | 2.13.0 | MCP 외부 도구 연동 |
| Tavily MCP | - | 웹 검색 도구 |
| Brave MCP | - | 대체 웹 검색 도구 |

### Infra
- **Docker / Docker Compose** - 전체 서비스 컨테이너화
- **AWS EC2** - 서버 배포

---

## 📁 프로젝트 구조

```
sbsj-project/
├── 1team-project-frontend/     # Next.js 프론트엔드
│   ├── app/                    # App Router 페이지
│   ├── components/             # UI 컴포넌트
│   │   └── ui/                 # shadcn 컴포넌트
│   ├── hooks/                  # 커스텀 훅
│   ├── lib/                    # 유틸리티
│   ├── Dockerfile
│   └── docker-compose.yml      # 전체 서비스 통합 실행
│
├── 1team-project-backend/      # Express 백엔드 API
│   ├── src/
│   │   ├── index.ts            # 서버 진입점
│   │   ├── routes/             # 라우터 모음
│   │   ├── controllers/        # 비즈니스 로직
│   │   ├── middleware/
│   │   │   ├── AuthJWT.ts      # 필수 인증 미들웨어
│   │   │   └── CheckJWTLogin.ts# 선택적 인증 미들웨어
│   │   ├── models/             # Prisma 모델
│   │   └── scripts/            # 데이터 업로드 스크립트
│   ├── prisma/
│   │   └── schema.prisma       # DB 스키마 정의
│   └── Dockerfile
│
├── 1team-project-ai/           # Flask AI 예측 서버
│   ├── app.py                  # Flask 메인 서버
│   ├── models/                 # 학습된 ML 모델 (.pkl)
│   │   ├── cafe_XGBoost.pkl
│   │   ├── hansic_XGBoost.pkl
│   │   └── hof_XGBoost.pkl
│   ├── data/                   # 동별 점수 데이터 (.xlsx)
│   ├── train_group_model.py    # LightGBM 모델 학습
│   ├── 그룹정규화.py           # 임대료 구간별 정규화
│   ├── 성장률_구하기.py        # 매출 성장률 계산
│   └── requirements.txt
│
└── 1team-project-rag/          # FastAPI RAG 챗봇
    └── backend/
        ├── main.py             # FastAPI 서버
        ├── index_documents.py  # 문서 인덱싱 스크립트
        ├── mcp_config.json     # MCP 외부 도구 설정
        ├── rag/
        │   ├── rag_chain.py    # RAG 체인 구성
        │   ├── retriever.py    # 문서 검색기
        │   ├── embeddings.py   # BGE-M3-KO 임베딩
        │   ├── vector_store.py # ChromaDB 연동
        │   └── document_loader.py
        └── data/
            ├── documents/      # 원본 문서 (txt/pdf/docx/md)
            └── chroma_db/      # 벡터 DB 저장소
```

---

## 🔌 API 명세

### Backend API (Port 8000)

#### 인증 (Auth)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/auth/register` | 회원가입 | ❌ |
| POST | `/auth/login` | 로그인 (JWT 발급) | ❌ |
| POST | `/auth/refresh` | Access Token 갱신 | ❌ |
| GET | `/auth/google` | Google 소셜 로그인 | ❌ |
| GET | `/auth/kakao` | Kakao 소셜 로그인 | ❌ |
| GET | `/auth/naver` | Naver 소셜 로그인 | ❌ |

> 토큰 형식: `Authorization: Bearer <accessToken>`  
> Access Token 유효시간: **15분** / Refresh Token: **7일**

#### 게시판 (Board)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/board` | 게시글 목록 | 선택 |
| GET | `/board/:id` | 게시글 상세 | 선택 |
| POST | `/board/write` | 게시글 작성 | ✅ |
| PUT | `/board/edit/:id` | 게시글 수정 | ✅ |
| DELETE | `/board/delete/:id` | 게시글 삭제 | ✅ |

### AI Server API (Port 5000)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/predict` | 업종별 상권 점수 직접 예측 |
| GET | `/score?dong=OO&type=OO` | 특정 행정동 업종별 점수 조회 |
| GET | `/score_all?dong=OO` | 특정 행정동 3개 업종 점수 한번에 조회 |
| GET | `/predict-data` | 미래 분기 자동회귀 예측 |

**`/predict` 요청 예시:**
```json
{
  "type": "cafe",
  "정규화매출효율": 0.72,
  "정규화성장률": 0.55,
  "정규화경쟁점수": 0.38,
  "작년 매출": 150000000,
  "이전 매출": 130000000,
  "작년 점포수": 45,
  "이전 점포수": 42
}
```

**`/predict-data` 쿼리 파라미터:**
```
GET /predict-data?gu=강남구&dong=개포1동&start_year=2026&start_quarter=1&n_steps=2
```

### RAG Chatbot API (Port 8001)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/rag-chat-stream` | RAG 챗봇 스트리밍 응답 (SSE) |
| POST | `/api/rag-reindex` | 문서 재인덱싱 (새 문서 추가 시) |

**`/api/rag-chat-stream` 요청 예시:**
```json
{
  "message": "강남구에서 카페 창업하기 좋은 동은 어디인가요?",
  "conversation_history": [
    {"role": "user", "content": "이전 질문"},
    {"role": "assistant", "content": "이전 답변"}
  ]
}
```

**SSE 스트리밍 이벤트:**
| 이벤트 | 설명 |
|--------|------|
| `sources` | 검색된 로컬 문서 출처 |
| `mcp_results` | MCP 외부 도구 검색 결과 |
| `tools_used` | 사용된 MCP 도구 목록 |
| `answer` | LLM 답변 (스트리밍) |
| `done` | 응답 완료 |

---

## 🤖 AI 모델 상세

### 상권 점수 산출 방식

```
Y점수 = 매출효율 × 0.4 + 성장률 × 0.3 + 경쟁밀도(역지표) × 0.3
```

| 지표 | 설명 |
|------|------|
| 매출효율 | 점포당 평균 매출 (높을수록 좋음) |
| 성장률 | (당월매출 - 작년매출) / 작년매출 |
| 경쟁밀도 | 동내 점포 수 밀도 (낮을수록 좋음, 역정규화 적용) |

### 그룹 정규화

임대료 구간(최저가/저가/중가/고가/최고가)별로 분리하여 정규화함으로써 **같은 임대료 수준 내에서 공정한 비교**가 가능합니다.

### 미래 예측 (Auto-Regressive)

- lag1 (직전 분기) / lag4 (1년 전) 피처를 사용한 시계열 예측
- 예측값을 다음 분기의 lag로 재사용하는 자동회귀 방식
- RandomForest 기반 멀티 타겟 예측 (9개 지표 동시 예측)

### RAG 챗봇 흐름

```
질문 입력
   ↓
ChromaDB에서 유사 문서 검색 (BGE-M3-KO 임베딩)
   ↓
LLM이 로컬 문서로 충분한지 판단
   ↓ (부족하면)
MCP 도구 자동 호출 (Tavily or Brave 웹 검색)
   ↓
로컬 문서 + 웹 검색 결과 통합
   ↓
GPT-4o-mini로 최종 답변 생성 (SSE 스트리밍)
```

---

## 🚀 실행 방법

### 방법 1: Docker Compose (권장)

```bash
# 1. 레포지토리 클론
git clone https://github.com/AI11KOR/sbsj-project.git
cd sbsj-project

# 2. 환경변수 파일 준비
# 각 서비스 폴더에 .env 파일 생성 (아래 환경변수 참고)

# 3. 전체 서비스 실행
cd 1team-project-frontend
docker-compose up --build
```

### 방법 2: 서비스별 개별 실행

#### Backend (Node.js)
```bash
cd 1team-project-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev        # http://localhost:8000
```

#### Frontend (Next.js)
```bash
cd 1team-project-frontend
pnpm install       # 또는 npm install
pnpm dev           # http://localhost:3000
```

#### AI Server (Flask)
```bash
cd 1team-project-ai
pip install -r requirements.txt
python app.py      # http://localhost:5000
```

#### RAG Chatbot (FastAPI)
```bash
cd 1team-project-rag/backend

# Windows
start_server.bat

# 또는 수동 실행
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
python index_documents.py    # 최초 1회 문서 인덱싱
uvicorn main:app --reload --port 8001
```

---

## ⚙️ 환경변수

### Backend `.env`
```env
DATABASE_URL="mysql://user:password@localhost:3306/sbsj"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="your-bucket"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
KAKAO_CLIENT_ID="..."
NAVER_CLIENT_ID="..."
NAVER_CLIENT_SECRET="..."
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### RAG `.env`
```env
OPENAI_API_KEY="sk-..."
RAG_SCORE_THRESHOLD=0.65
RAG_TOP_K=3
RAG_MODEL_NAME=gpt-4o-mini
RAG_TEMPERATURE=0.7
RAG_MAX_TOKENS=1000
TAVILY_API_KEY="..."
SMITHERY_BRAVE_KEY="..."
SMITHERY_BRAVE_PROFILE="..."
```

### Frontend `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RAG_URL=http://localhost:8001
NEXT_PUBLIC_FLASK_URL=http://localhost:5000
NEXT_PUBLIC_KAKAO_MAP_KEY="your-kakao-map-key"
```

---

## 🔐 인증 미들웨어

백엔드는 두 가지 JWT 인증 미들웨어를 제공합니다.

| 미들웨어 | 파일 | 설명 | 사용 예 |
|----------|------|------|---------|
| `authenticateToken` | `AuthJWT.ts` | 로그인 **필수** | 글쓰기, 수정, 삭제 |
| `checkToken` | `CheckJWTLogin.ts` | 로그인 **선택** | 게시글 목록/상세 조회 |

```typescript
// 필수 인증
router.post('/board/write', authenticateToken, saveBoard);

// 선택적 인증 (비로그인도 접근 가능, 로그인 시 추가 기능 제공)
router.get('/board', checkToken, BoardPage);
```

---

## 📊 데이터 출처

- 서울시 우리마을가게 상권분석 서비스 (공공데이터포털)
- 서울시 행정동별 유동인구 데이터
- 서울시 임대료 데이터
- 서울시 업종별 매출 / 점포 수 데이터 (분기별)

---

## 👥 팀 구성

**대구 AI 개발교육 1조 - 상부상조**

---
