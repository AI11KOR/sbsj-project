# 1team-project-rag

RAG (Retrieval-Augmented Generation) 기반 AI 챗봇 서비스

## 프로젝트 구조

```
1team-project-rag/
├── backend/
│   ├── main.py                 # FastAPI 서버
│   ├── index_documents.py      # 문서 인덱싱 스크립트
│   ├── rag/                    # RAG 모듈
│   ├── data/
│   │   ├── documents/         # 원본 문서
│   │   └── chroma_db/         # 벡터 DB
│   ├── requirements.txt
│   └── .env
└── README.md
```

## 시작하기

### 1. 가상환경 생성 및 활성화

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
OPENAI_API_KEY=sk-...
RAG_SCORE_THRESHOLD=0.65
RAG_TOP_K=3
```

### 4. 문서 인덱싱 (최초 1회)

```bash
python index_documents.py
```

### 5. 서버 실행

```bash
uvicorn main:app --reload --port 8001
```

## API 엔드포인트

- `POST /api/rag-chat-stream`: RAG 챗봇 스트리밍 엔드포인트

## 참고

- 상세 아키텍처: `../RAG_SYSTEM_ARCHITECTURE.md`

