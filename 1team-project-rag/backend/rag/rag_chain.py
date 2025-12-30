"""
RAG (Retrieval-Augmented Generation) 파이프라인

로컬 문서 검색(RAG) + 필요 시 MCP 도구 호출(외부 검색/프로토콜)까지 통합합니다.
"""

from typing import List, Dict, Any, Optional
from openai import OpenAI
import os
import asyncio

from .retriever import Retriever
from .mcp_client_new import UniversalMCPClient, MCPToolRouter


class RAGChain:
    """RAG 파이프라인 클래스 (MCP Tool Router 통합)"""

    def __init__(
        self,
        openai_api_key: str = None,
        retriever: Retriever = None,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        # mcp_config_path: str = "mcp_config.json",
        mcp_config_path: str = "/app/backend/mcp_config.json",
        enable_mcp: bool = True,
    ):
        if openai_api_key is None:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")

        # OpenAI 클라이언트 초기화 (Win 환경에서 proxies 이슈 방지용 httpx 클라이언트 사용)
        try:
            import httpx

            http_client = httpx.Client(
                timeout=httpx.Timeout(60.0, connect=10.0),
                follow_redirects=True,
            )
            self.client = OpenAI(api_key=openai_api_key, http_client=http_client)
        except ImportError:
            self.client = OpenAI(api_key=openai_api_key)

        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        self.retriever = retriever or Retriever()

        # MCP Tool Router
        self.enable_mcp = enable_mcp
        self.mcp_initialized = False
        self.mcp_tool_router: Optional[MCPToolRouter] = None
        self.universal_client: Optional[UniversalMCPClient] = None

        if enable_mcp:
            try:
                print(f"[RAG] MCP Tool Router 초기화 중... (설정: {mcp_config_path})")
                self.universal_client = UniversalMCPClient.from_config(mcp_config_path)
                self.mcp_tool_router = MCPToolRouter(
                    openai_api_key=openai_api_key,
                    universal_client=self.universal_client,
                    model_name=os.getenv("MCP_TOOL_MODEL_NAME", "gpt-4o-mini"),
                    temperature=float(os.getenv("MCP_TOOL_TEMPERATURE", "0.3")),
                    enable_description_enhancement=True,
                )
                print("[OK] MCP Tool Router 활성화 완료 (도구 발견은 첫 요청 시 실행)")
            except Exception as e:
                print(f"[ERROR] MCP Tool Router 초기화 실패: {e}")
                print("   -> MCP 기능 비활성화")
                self.enable_mcp = False
                self.mcp_tool_router = None
                self.universal_client = None

        print(f"[OK] RAG 파이프라인 준비 완료 (모델: {model_name}, MCP: {self.enable_mcp})")

    def _build_system_prompt(self) -> str:
        return """당신은 상권 분석 및 창업 컨설팅 전문가이자 친절한 챗봇입니다.

원칙:
- 로컬 참고 문서가 있으면 최우선으로 활용하세요.
- 참고 문서에 없는 내용은 '제공된 자료에는 해당 정보가 없습니다'라고 말한 뒤, 필요하면 추가로 조사/가정/일반 지식을 구분해 설명하세요.
- MCP 도구 결과가 있으면 최신 정보로 보강하되, 과장/추측은 피하세요.
- 한국어로 간결하고 실용적으로 답변하세요.
"""

    def _format_mcp_results_for_prompt(self, mcp_results: Dict[str, Any], max_results_per_tool: int = 3) -> str:
        if not mcp_results:
            return "MCP 검색 결과가 없습니다."

        lines: List[str] = []
        for tool_name, tool_result in mcp_results.items():
            lines.append(f"[도구: {tool_name}]")

            if isinstance(tool_result, dict) and tool_result.get("error"):
                lines.append(f"- 오류: {tool_result.get('error')}")
                lines.append("")
                continue

            # 결과가 리스트/딕셔너리/문자열 등 다양할 수 있어 안전하게 문자열화
            if isinstance(tool_result, list):
                preview = tool_result[:max_results_per_tool]
                lines.append(str(preview))
            else:
                lines.append(str(tool_result)[:4000])
            lines.append("")

        return "\n".join(lines).strip()

    async def _execute_mcp_tools(self, query: str, local_docs: List[Dict[str, Any]], conversation_history=None) -> Dict[str, Any]:
        if not self.enable_mcp or not self.mcp_tool_router:
            return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}

        # 첫 요청에만 도구 발견(Lazy)
        if not self.mcp_initialized:
            print("[RAG] 첫 요청 감지, MCP 도구 자동 발견 시작...")
            try:
                await asyncio.wait_for(self.mcp_tool_router.initialize(), timeout=10.0)
            except asyncio.TimeoutError:
                print("[WARN] MCP 초기화 타임아웃(10초), MCP 없이 진행")
                self.mcp_initialized = True
                return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}
            except Exception as e:
                print(f"[ERROR] MCP 초기화 실패: {e}")
                self.mcp_initialized = True
                return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}
            finally:
                self.mcp_initialized = True

        try:
            return await asyncio.wait_for(
                self.mcp_tool_router.select_and_execute_mcp_tools(
                    query=query,
                    local_docs=local_docs,
                    conversation_history=conversation_history,
                ),
                timeout=15.0,
            )
        except asyncio.TimeoutError:
            print("[WARN] MCP 실행 타임아웃(15초), MCP 없이 진행")
            return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}
        except Exception as e:
            print(f"[ERROR] MCP 실행 실패: {e}")
            return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}

    def _build_messages(self, query: str, retrieved_docs: List[Dict[str, Any]], conversation_history=None, mcp_context: Optional[str] = None) -> List[Dict[str, str]]:
        system_prompt = self._build_system_prompt()
        context = self.retriever.format_documents_for_prompt(retrieved_docs)

        if mcp_context:
            user_prompt = f"""[로컬 참고 문서]
{context}

[외부 도구(MCP) 결과]
{mcp_context}

[사용자 질문]
{query}

위 정보를 활용해 답변해주세요.
"""
        else:
            user_prompt = f"""[로컬 참고 문서]
{context}

[사용자 질문]
{query}

위 참고 문서를 바탕으로 답변해주세요.
"""

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_prompt})
        return messages

    async def run(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None, top_k: int = 3) -> Dict[str, Any]:
        print(f"\n[SEARCH] RAG 파이프라인 시작: {query}")
        local_docs = self.retriever.search(query, top_k=top_k)

        if not local_docs:
            local_docs = []

        mcp_result = await self._execute_mcp_tools(query, local_docs, conversation_history)

        mcp_context = None
        if mcp_result.get("mcp_used") and mcp_result.get("results"):
            mcp_context = self._format_mcp_results_for_prompt(mcp_result["results"])

        messages = self._build_messages(query, local_docs, conversation_history, mcp_context=mcp_context)

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer,
            "sources": local_docs,
            "query": query,
            "usage": {
                "prompt_tokens": getattr(response.usage, "prompt_tokens", None),
                "completion_tokens": getattr(response.usage, "completion_tokens", None),
                "total_tokens": getattr(response.usage, "total_tokens", None),
            },
            "mcp_results": mcp_result.get("results", {}) if mcp_result.get("mcp_used") else {},
            "tools_used": mcp_result.get("tools_used", []),
        }

    async def stream_run(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None, top_k: int = 3):
        print(f"\n[SEARCH] RAG 파이프라인 시작 (스트리밍): {query}")

        local_docs = self.retriever.search(query, top_k=top_k) or []

        yield {"type": "sources", "content": local_docs}

        mcp_result = await self._execute_mcp_tools(query, local_docs, conversation_history)
        if mcp_result.get("mcp_used") and mcp_result.get("results"):
            yield {"type": "mcp_results", "content": mcp_result["results"]}
            yield {"type": "tools_used", "content": mcp_result.get("tools_used", [])}
            mcp_context = self._format_mcp_results_for_prompt(mcp_result["results"])
        else:
            mcp_context = None

        messages = self._build_messages(query, local_docs, conversation_history, mcp_context=mcp_context)

        try:
            stream = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True,
            )

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield {"type": "answer", "content": chunk.choices[0].delta.content}

        except Exception as e:
            print(f"[ERROR] LLM 스트리밍 실패: {e}")
            yield {"type": "error", "content": str(e)}

