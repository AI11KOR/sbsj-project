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
RAG_MODEL_NAME=gpt-4o-mini
RAG_TEMPERATURE=0.7
RAG_MAX_TOKENS=1000
```

### 4. 문서 인덱싱 (최초 1회)

```bash
python index_documents.py
```

> **새 문서를 추가했나요?**  
> `data/documents/` 에 파일을 넣은 뒤에는 **재인덱싱**이 필요합니다.  
> 아래 두 방법 중 편한 것을 선택하세요.
>
> 1. **CLI 실행**: `python index_documents.py` (기존 방식)  
> 2. **API 호출**: 서버 실행 후 `POST http://localhost:8001/api/rag-reindex`  
>    ```bash
>    curl -X POST http://localhost:8001/api/rag-reindex
>    ```
>    호출이 끝나면 서버가 자동으로 새 컬렉션을 로드하므로 별도 재시작이 필요 없습니다.

### 5. 서버 실행

```bash
uvicorn main:app --reload --port 8001
```

## API 엔드포인트

- `POST /api/rag-chat-stream`: RAG 챗봇 스트리밍 엔드포인트
- `GET /health`: 서비스 상태 확인

## 환경 변수 설명

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 키 (필수) | - |
| `RAG_SCORE_THRESHOLD` | Distance 임계값 (유사도 필터링) | 0.65 |
| `RAG_TOP_K` | 검색할 문서 개수 | 3 |
| `RAG_MODEL_NAME` | OpenAI 모델 이름 | gpt-4o-mini |
| `RAG_TEMPERATURE` | LLM 창의성 (0~2) | 0.7 |
| `RAG_MAX_TOKENS` | 최대 응답 토큰 수 | 1000 |

## 참고

- 상세 아키텍처: `../RAG_SYSTEM_ARCHITECTURE.md`

