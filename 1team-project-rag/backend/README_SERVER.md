# RAG 서버 실행 방법

## 🚀 빠른 시작

### CMD (명령 프롬프트) 사용자

#### 방법 1: 배치 파일 사용 (권장)

```cmd
start_server.bat
```

또는 더블클릭으로 실행

#### 방법 2: 수동 실행

```cmd
REM 1. 올바른 디렉토리로 이동
cd 1team-project-rag\backend

REM 2. 가상환경 활성화
venv\Scripts\activate.bat

REM 3. 서버 실행
uvicorn main:app --reload --port 8001
```

### PowerShell 사용자

#### 방법 1: 실행 스크립트 사용 (권장)

```powershell
# 이 폴더에서 실행
.\start_server.ps1
```

#### 방법 2: 수동 실행

```powershell
# 1. 올바른 디렉토리로 이동
cd 1team-project-rag\backend

# 2. 가상환경 활성화
.\venv\Scripts\Activate.ps1

# 3. 서버 실행
uvicorn main:app --reload --port 8001
```

## ✅ 서버 확인

서버가 시작되면 다음 URL로 접속할 수 있습니다:

- **Health Check**: http://localhost:8001/health
- **API 문서**: http://localhost:8001/docs
- **루트**: http://localhost:8001/

## ⚠️ 주의사항

1. **올바른 디렉토리에서 실행**
   - ❌ `C:\Users\dngus\sbsj-project2` (프로젝트 루트)
   - ✅ `C:\Users\dngus\sbsj-project2\1team-project-rag\backend`

2. **가상환경 활성화 필수**
   - 가상환경이 활성화되지 않으면 `uvicorn` 명령어를 찾을 수 없습니다.

3. **환경 변수 확인**
   - `.env` 파일에 `OPENAI_API_KEY`가 설정되어 있어야 합니다.

## MCP(외부 도구) 통합 사용 (RAG + 외부검색/프로토콜)

이 서버는 RAG(로컬 문서 검색)만으로 답변이 부족한 경우, **MCP(Model Context Protocol)** 기반 외부 도구를 자동으로 호출해 답변을 보강할 수 있습니다.

### ✅ 준비: 환경변수(.env)

`1team-project-rag/backend/env.example`을 복사해서 `1team-project-rag/backend/.env`로 만든 뒤, 아래 값을 설정하세요.

- **OPENAI_API_KEY**: 필수
- **TAVILY_API_KEY**: Tavily MCP 사용 시 필요
- **SMITHERY_BRAVE_KEY / SMITHERY_BRAVE_PROFILE**: Brave MCP(Smithery CLI) 사용 시 필요

예시:

```
OPENAI_API_KEY=...
TAVILY_API_KEY=...
SMITHERY_BRAVE_KEY=...
SMITHERY_BRAVE_PROFILE=...
```

### ✅ MCP 설정 파일

`1team-project-rag/backend/mcp_config.json`에서 MCP 서버들을 관리합니다.

### ✅ 동작 방식(요약)

- **1단계**: 로컬 문서 검색(RAG)
- **2단계**: LLM이 “로컬만으로 충분한지” 판단
  - 부족하면 MCP 도구를 자동 선택/호출 (예: `tavily_search`)
- **3단계**: 로컬 문서 + MCP 결과를 함께 넣어 최종 답변 생성

스트리밍(SSE) 이벤트는 기존 `sources/answer/error/done`에 더해 아래 이벤트가 추가될 수 있습니다.

- `mcp_results`: MCP 도구 실행 결과(원본)
- `tools_used`: 사용된 도구 이름 리스트

## 🐛 문제 해결

### "uvicorn을 찾을 수 없습니다" 오류

**원인**: 가상환경이 활성화되지 않았습니다.

**해결**:
- **CMD**: `venv\Scripts\activate.bat`
- **PowerShell**: `.\venv\Scripts\Activate.ps1`

가상환경이 활성화되면 프롬프트 앞에 `(venv)`가 표시됩니다.

### "No module named 'fastapi'" 오류

**원인**: 가상환경이 활성화되지 않았거나 패키지가 설치되지 않았습니다.

**해결**:
```cmd
REM 1. 가상환경 활성화
venv\Scripts\activate.bat

REM 2. 패키지 재설치 (필요시)
pip install -r requirements.txt
```

### "Activate.ps1/activate.bat을 찾을 수 없습니다" 오류

**원인**: 잘못된 디렉토리에서 실행했습니다.

**해결**:
```cmd
cd 1team-project-rag\backend
```

### 포트 8001이 이미 사용 중

**해결**:
1. 다른 프로세스가 포트를 사용 중인지 확인
2. 다른 포트 사용: `uvicorn main:app --reload --port 8002`
3. 백엔드 `.env` 파일의 `RAG_SERVICE_URL`도 함께 변경

## 📝 참고

- 서버를 중지하려면 `Ctrl+C`를 누르세요.
- `--reload` 옵션은 코드 변경 시 자동으로 서버를 재시작합니다.
- 첫 요청 시 RAG 시스템 초기화에 10~20초가 걸릴 수 있습니다.

