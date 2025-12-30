"""
MCP Tool Calling 시스템

LLM이 필요한 MCP 도구를 자동으로 선택하고 실행하는 시스템입니다.
RAG 레이어(로컬 검색)는 별도로 동작하며, MCP는 추가 외부 도구만 관리합니다.
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional
from openai import OpenAI
from fastmcp import Client
import json
import asyncio
import os


# ============================================
# 1. UniversalMCPClient (범용 MCP 클라이언트)
# ============================================

class UniversalMCPClient:
    """
    여러 MCP 서버를 통합 관리하는 범용 클라이언트

    - 여러 MCP 서버 등록 (Tavily, 커스텀 서버 등)
    - 도구 이름으로 자동 디스패치
    - 모든 MCP 서버의 도구 목록 통합 관리
    """

    def __init__(self):
        """MCP 클라이언트 초기화"""
        self.mcp_servers: Dict[str, Dict[str, Any]] = {}  # {server_name: {"client": client, "tools": [...], ...}}
        print("[UniversalMCPClient] 초기화 완료")

    @classmethod
    def from_config(cls, config_path: str) -> "UniversalMCPClient":
        """
        JSON 설정 파일로 UniversalMCPClient 초기화

        Args:
            config_path: MCP 설정 파일 경로 (예: "mcp_config.json")
                형식:
                {
                    "mcpServers": {
                        "tavily": {
                            "url": "https://mcp.tavily.com/mcp/?tavilyApiKey=${TAVILY_API_KEY}"
                        }
                    }
                }

        Returns:
            초기화된 UniversalMCPClient 인스턴스
        """
        import re

        print(f"\n[UniversalMCPClient] JSON 설정 파일 로드: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        def replace_env_vars(text: str) -> str:
            """${VAR_NAME} 형식의 환경변수를 실제 값으로 치환"""
            def replacer(match):
                var_name = match.group(1)
                return os.getenv(var_name, match.group(0))

            return re.sub(r"\$\{([^}]+)\}", replacer, text)

        instance = cls()

        if "mcpServers" not in config:
            raise ValueError("JSON 설정에 'mcpServers' 키가 없습니다.")

        for server_name, server_config in config["mcpServers"].items():
            print(f"[UniversalMCPClient] 서버 등록 중: {server_name}")

            if "url" in server_config:
                server_config["url"] = replace_env_vars(server_config["url"])
            if "command" in server_config:
                server_config["command"] = replace_env_vars(server_config["command"])
            if "args" in server_config and isinstance(server_config["args"], list):
                server_config["args"] = [
                    replace_env_vars(arg) if isinstance(arg, str) else arg
                    for arg in server_config["args"]
                ]

            # -----------------------------
            # Minimal validation / skip when required secrets are missing
            # -----------------------------
            # Tavily: url contains tavilyApiKey=...  (must not be empty)
            if server_name.lower() == "tavily" and "url" in server_config:
                url = server_config.get("url") or ""
                if "tavilyApiKey=" in url and url.endswith("tavilyApiKey="):
                    print("   [SKIP] tavily API key가 비어있어 서버 등록을 건너뜁니다. (.env의 TAVILY_API_KEY 확인)")
                    continue

            # Brave(Smithery): requires --key and --profile values
            if server_name.lower() == "brave" and "args" in server_config:
                args = server_config.get("args") or []
                def _arg_value(flag: str) -> str:
                    if flag in args:
                        i = args.index(flag)
                        if i + 1 < len(args):
                            return str(args[i + 1])
                    return ""
                brave_key = _arg_value("--key")
                brave_profile = _arg_value("--profile")
                if not brave_key or not brave_profile:
                    print("   [SKIP] brave key/profile이 비어있어 서버 등록을 건너뜁니다. (.env의 SMITHERY_BRAVE_* 확인)")
                    continue

            single_server_config = {"mcpServers": {server_name: server_config}}

            try:
                fastmcp_client = Client(single_server_config)
                instance.mcp_servers[server_name] = {
                    "client": fastmcp_client,
                    "tools": [],
                    "config": server_config,
                }
                print(f"   [OK] {server_name} 등록 완료")
            except Exception as e:
                print(f"   [ERROR] {server_name} 등록 실패: {e}")

        print(f"[OK] 총 {len(instance.mcp_servers)}개 MCP 서버 로드 완료\n")
        return instance

    async def discover_all_tools(self) -> List[Dict[str, Any]]:
        """
        모든 등록된 MCP 서버의 도구 목록 수집

        Returns:
            통합 도구 목록
        """
        all_tools: List[Dict[str, Any]] = []

        for server_name, server_info in self.mcp_servers.items():
            client = server_info["client"]
            try:
                async with client:
                    tools = await client.list_tools()

                for tool in tools:
                    if hasattr(tool, "__dict__"):
                        tool_dict = {
                            "name": getattr(tool, "name", "unknown"),
                            "description": getattr(tool, "description", ""),
                            "inputSchema": getattr(tool, "inputSchema", {}),
                            "server": server_name,
                        }
                    elif isinstance(tool, dict):
                        tool_dict = {**tool, "server": server_name}
                    else:
                        continue

                    all_tools.append(tool_dict)

                # 서버에 도구 목록 캐싱
                server_info["tools"] = all_tools
                print(f"[UniversalMCPClient] {server_name}: {len(tools)}개 도구 발견")
            except Exception as e:
                print(f"[ERROR] {server_name} 도구 목록 조회 실패: {e}")

        return all_tools

    async def call_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        도구 이름으로 적절한 MCP 서버에 동적 디스패치
        """
        print(f"\n[UniversalMCPClient] 도구 호출: {tool_name}")
        print(f"   파라미터: {json.dumps(tool_args, ensure_ascii=False)[:200]}...")

        target_server = None
        for server_name, server_info in self.mcp_servers.items():
            for tool in server_info.get("tools", []):
                if tool.get("name") == tool_name:
                    target_server = server_name
                    break
            if target_server:
                break

        if not target_server:
            raise ValueError(f"도구 '{tool_name}'을 찾을 수 없습니다.")

        client = self.mcp_servers[target_server]["client"]
        try:
            async with client:
                result = await client.call_tool(tool_name, tool_args)
                if hasattr(result, "data"):
                    result_data = result.data
                else:
                    result_data = result

            print(f"[OK] 도구 실행 완료: {tool_name}")
            return result_data
        except Exception as e:
            print(f"[ERROR] 도구 실행 실패: {e}")
            raise


# ============================================
# 2. ToolSchemaConverter (스키마 변환)
# ============================================

class ToolSchemaConverter:
    """MCP Tool Schema ↔ OpenAI Function Schema 변환"""

    @staticmethod
    def mcp_to_openai(mcp_tool: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": mcp_tool.get("name"),
                "description": mcp_tool.get("description", ""),
                "parameters": mcp_tool.get("inputSchema", {}),
            },
        }

    @staticmethod
    def enhance_tool_description(openai_tool: Dict[str, Any]) -> Dict[str, Any]:
        tool_name = openai_tool["function"]["name"]
        if tool_name == "tavily_search":
            openai_tool["function"]["description"] += """

**사용 시점:**
- 최신 뉴스, 트렌드, 실시간 데이터가 필요한 경우
- "2025년", "최근", "현재", "요즘" 등의 키워드가 있는 경우
- 로컬 문서에 없는 최신 정보가 필요한 경우

**사용 안 함:**
- 로컬 문서로 충분히 답변 가능한 경우
- 일반적인 가이드, 기본 지식 질문
- 시간과 무관한 기본 개념 설명
"""
        return openai_tool

    @staticmethod
    def get_tavily_tools_manual() -> List[Dict[str, Any]]:
        # 자동 발견 실패 시 폴백(최소)
        return [
            {
                "type": "function",
                "function": {
                    "name": "tavily_search",
                    "description": "실시간 웹 검색 도구. 최신 정보/뉴스/트렌드가 필요할 때 사용.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "검색 쿼리"},
                            "search_depth": {"type": "string", "enum": ["basic", "advanced"]},
                            "max_results": {"type": "integer"},
                            "topic": {"type": "string", "enum": ["general", "news"]},
                        },
                        "required": ["query"],
                    },
                },
            }
        ]


# ============================================
# 3. MCPToolRouter (핵심 로직)
# ============================================

class MCPToolRouter:
    """
    LLM 기반 MCP 도구 선택 및 실행 라우터

    - RAG 검색 결과를 고려하여 추가 MCP 도구 필요성 판단
    - LLM이 자동으로 필요한 도구 선택
    - 선택된 도구 실행 및 결과 반환
    """

    def __init__(
        self,
        openai_api_key: str,
        universal_client: UniversalMCPClient,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.3,
        enable_description_enhancement: bool = True,
    ):
        # OpenAI 클라이언트 초기화
        # - 윈도우 환경에서 시스템 프록시/환경변수 영향으로 httpx Client 생성 시
        #   proxies 관련 예외가 발생하는 케이스가 있어, 명시적으로 http_client를 주입합니다.
        try:
            import httpx

            http_client = httpx.Client(
                timeout=httpx.Timeout(60.0, connect=10.0),
                follow_redirects=True,
            )
            self.client = OpenAI(api_key=openai_api_key, http_client=http_client)
        except Exception:
            # httpx 미설치/기타 환경에서도 동작하도록 fallback
            self.client = OpenAI(api_key=openai_api_key)
        self.universal_client = universal_client
        self.model_name = model_name
        self.temperature = temperature
        self.enable_description_enhancement = enable_description_enhancement

        self.discovered_tools: List[Dict[str, Any]] = []
        self.is_initialized = False

        print(f"[MCPToolRouter] 초기화 완료 (모델: {model_name})")

    async def initialize(self) -> int:
        if self.is_initialized:
            return len(self.discovered_tools)

        print("[MCPToolRouter] MCP 도구 자동 발견 시작...")

        try:
            mcp_tools = await self.universal_client.discover_all_tools()
            if not mcp_tools:
                print("[WARN] MCP 도구를 찾을 수 없음, Fallback으로 수동 정의 사용")
                self.discovered_tools = ToolSchemaConverter.get_tavily_tools_manual()
                self.is_initialized = True
                return len(self.discovered_tools)

            self.discovered_tools = []
            for mcp_tool in mcp_tools:
                openai_tool = ToolSchemaConverter.mcp_to_openai(mcp_tool)
                if self.enable_description_enhancement:
                    openai_tool = ToolSchemaConverter.enhance_tool_description(openai_tool)
                self.discovered_tools.append(openai_tool)

            self.is_initialized = True
            print(f"[OK] MCPToolRouter 초기화 완료: {len(self.discovered_tools)}개 도구 준비")
            return len(self.discovered_tools)

        except Exception as e:
            print(f"[ERROR] MCP 도구 자동 발견 실패: {e}")
            self.discovered_tools = ToolSchemaConverter.get_tavily_tools_manual()
            self.is_initialized = True
            return len(self.discovered_tools)

    def _is_simple_query(self, query: str) -> bool:
        simple_patterns = ["안녕", "hello", "hi", "감사", "고마워", "thank", "잘가", "bye", "굿바이"]
        query_lower = query.lower()
        if len(query) <= 10:
            return any(p in query_lower for p in simple_patterns)
        return False

    async def select_and_execute_mcp_tools(
        self,
        query: str,
        local_docs: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        print(f"\n[MCPToolRouter] 도구 선택 시작: {query[:80]}...")

        if self._is_simple_query(query):
            return {"mcp_used": False, "tools_used": [], "results": {}, "direct_answer": None}

        try:
            tools_result = await asyncio.wait_for(
                self._ask_llm_for_tools(query, local_docs, conversation_history),
                timeout=30.0,
            )
        except Exception as e:
            print(f"[ERROR] LLM 도구 선택 실패: {e}")
            tools_result = {"tool_calls": [], "direct_answer": None}

        if not tools_result.get("tool_calls"):
            return {
                "mcp_used": False,
                "tools_used": [],
                "results": {},
                "direct_answer": tools_result.get("direct_answer"),
            }

        results: Dict[str, Any] = {}
        tools_used: List[str] = []

        for tool_call in tools_result["tool_calls"]:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)
            try:
                result = await self.universal_client.call_tool(tool_name, tool_args)
                results[tool_name] = result
                tools_used.append(tool_name)
            except Exception as e:
                results[tool_name] = {"error": str(e)}

        return {"mcp_used": True, "tools_used": tools_used, "results": results, "direct_answer": None}

    async def _ask_llm_for_tools(
        self,
        query: str,
        local_docs: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        system_prompt = self._build_tool_selection_prompt(local_docs)
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            messages.extend(conversation_history[-4:])

        messages.append({"role": "user", "content": query})

        available_tools = self.discovered_tools or ToolSchemaConverter.get_tavily_tools_manual()

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            tools=available_tools,
            tool_choice="auto",
            temperature=self.temperature,
        )

        message = response.choices[0].message
        tool_calls = message.tool_calls or []

        return {"tool_calls": tool_calls, "direct_answer": message.content if not tool_calls else None}

    def _build_tool_selection_prompt(self, local_docs: List[Dict[str, Any]]) -> str:
        if local_docs:
            docs_summary = f"로컬 문서 {len(local_docs)}개 검색 완료"
            docs_preview = "\n".join(
                [
                    f"- {doc.get('metadata', {}).get('source', 'unknown')} (유사도: {doc.get('score', 0):.2f})"
                    for doc in local_docs[:3]
                ]
            )
        else:
            docs_summary = "로컬 문서 검색 결과 없음"
            docs_preview = ""

        return f"""당신은 상권 분석 챗봇의 도구 선택 에이전트입니다.

현재 상황:
{docs_summary}
{docs_preview}

판단 기준:
- 로컬 문서로 충분하면 도구를 호출하지 마세요.
- 최신 정보/뉴스/트렌드/실시간 데이터가 필요하면 도구를 호출하세요.
"""


