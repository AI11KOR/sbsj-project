# FastAPI 서버 메인 파일
# RAG 기반 챗봇 서버

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, List, Dict
import os
import json
import asyncio
import sys

# ✅ (DEBUG Origin 확인용)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# RAG 모듈 import
from rag.rag_chain import RAGChain
from rag.retriever import Retriever

# ============================================
# 환경 변수 로드
# ============================================
load_dotenv()

# ============================================
# ✅ FastAPI 앱 생성 (※ 딱 1번만!)
# ============================================
app = FastAPI(
    title="1team RAG Chatbot API",
    description="RAG 기반 상권 분석 챗봇 백엔드",
    version="1.0.0"
)

# ============================================
# ✅ (DEBUG) 실제로 들어오는 Origin을 로그로 찍기 (CORS보다 먼저!)
# - CORS_DEBUG=1 일 때만 찍히게
# ============================================
class DebugOriginMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if os.getenv("CORS_DEBUG", "0") == "1":
            origin = request.headers.get("origin")
            acrm = request.headers.get("access-control-request-method")
            acrh = request.headers.get("access-control-request-headers")
            print("[DEBUG_ORIGIN] origin=", repr(origin), "acrm=", repr(acrm), "acrh=", repr(acrh))
        return await call_next(request)

app.add_middleware(DebugOriginMiddleware)

# ============================================
# ✅ CORS 설정 (※ 딱 1번만!)
# - 기본 허용 + env(CORS_ORIGINS)로 추가 가능
# ============================================
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://43.201.248.189:3000",
]

# ✅ 콤마로 여러 개 추가 가능: CORS_ORIGINS="http://a:3000,http://b:3000"
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
if cors_origins_env:
    extra_list = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    DEFAULT_ALLOWED_ORIGINS.extend(extra_list)

# (예전 단일 키도 호환) CORS_ORIGIN="http://something"
extra_origin = os.getenv("CORS_ORIGIN", "").strip()
if extra_origin:
    DEFAULT_ALLOWED_ORIGINS.append(extra_origin)

# 중복 제거 + 빈 값 제거
ALLOWED_ORIGINS = list(dict.fromkeys([o for o in DEFAULT_ALLOWED_ORIGINS if o]))

print("[CORS] ALLOWED_ORIGINS =", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# RAG 시스템 초기화 (Lazy Loading)
# ============================================
rag_chain = None

def get_rag_chain():
    global rag_chain
    if rag_chain is None:
        print("🚀 RAG 시스템 초기화 중... (첫 요청, 10~20초 소요)")

        retriever = Retriever(
            top_k=int(os.getenv("RAG_TOP_K", "3")),
            score_threshold=float(os.getenv("RAG_SCORE_THRESHOLD", "0.65"))
        )

        rag_chain = RAGChain(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            retriever=retriever,
            model_name=os.getenv("RAG_MODEL_NAME", "gpt-4o-mini"),
            temperature=float(os.getenv("RAG_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("RAG_MAX_TOKENS", "1000")),
            mcp_config_path=os.getenv("MCP_CONFIG_PATH", "/app/backend/mcp_config.json"),
        )
        print("✅ RAG 시스템 준비 완료!")
    return rag_chain

# ============================================
# Pydantic 모델
# ============================================
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

# ============================================
# 상태 체크
# ============================================
@app.get("/")
async def root():
    return {"message": "1team RAG Chatbot API", "status": "healthy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ============================================
# RAG 챗봇 스트리밍
# ============================================
async def stream_rag_response(query: str, conversation_history: Optional[List[Dict[str, str]]] = None, top_k: int = 3):
    try:
        rag = get_rag_chain()

        async for chunk in rag.stream_run(
            query=query,
            conversation_history=conversation_history,
            top_k=top_k
        ):
            chunk_type = chunk.get("type")
            content = chunk.get("content")

            if chunk_type == "sources":
                yield f"data: {json.dumps({'event': 'sources', 'sources': content}, ensure_ascii=False)}\n\n"
            elif chunk_type == "mcp_results":
                yield f"data: {json.dumps({'event': 'mcp_results', 'mcp_results': content}, ensure_ascii=False)}\n\n"
            elif chunk_type == "tools_used":
                yield f"data: {json.dumps({'event': 'tools_used', 'tools_used': content}, ensure_ascii=False)}\n\n"
            elif chunk_type == "answer":
                yield f"data: {json.dumps({'event': 'answer', 'content': content}, ensure_ascii=False)}\n\n"
            elif chunk_type == "error":
                yield f"data: {json.dumps({'event': 'error', 'message': content}, ensure_ascii=False)}\n\n"

        yield f"data: {json.dumps({'event': 'done'}, ensure_ascii=False)}\n\n"

    except Exception as e:
        error_msg = json.dumps({"event": "error", "message": f"RAG 스트리밍 오류: {str(e)}"}, ensure_ascii=False)
        yield f"data: {error_msg}\n\n"

@app.post("/api/rag-chat-stream")
async def rag_chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_rag_response(
            query=request.message,
            conversation_history=request.conversation_history,
            top_k=int(os.getenv("RAG_TOP_K", "3"))
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ============================================
# 문서 재인덱싱
# ============================================
@app.post("/api/rag-reindex")
async def rag_reindex():
    script_path = os.path.join(os.path.dirname(__file__), "index_documents.py")
    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail="index_documents.py를 찾을 수 없습니다.")

    process = await asyncio.create_subprocess_exec(
        sys.executable,
        script_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()

    success = process.returncode == 0
    output = stdout.decode("utf-8", errors="ignore")
    errors = stderr.decode("utf-8", errors="ignore")

    if not success:
        raise HTTPException(
            status_code=500,
            detail={"message": "문서 재인덱싱 실패", "stdout": output, "stderr": errors},
        )

    global rag_chain
    rag_chain = None

    return {"message": "문서 재인덱싱 완료", "stdout": output, "stderr": errors}
