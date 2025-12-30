# CMD에서 RAG 서버 실행 방법

## 🚀 빠른 시작

### 방법 1: 배치 파일 사용 (권장)

```cmd
start_server.bat
```

또는 더블클릭으로 실행

### 방법 2: 수동 실행

```cmd
REM 1. 올바른 디렉토리로 이동
cd 1team-project-rag\backend

REM 2. 가상환경 활성화
venv\Scripts\activate.bat

REM 3. 서버 실행
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
   - CMD에서는 `venv\Scripts\activate.bat` 사용

3. **환경 변수 확인**
   - `.env` 파일에 `OPENAI_API_KEY`가 설정되어 있어야 합니다.

## 🐛 문제 해결

### "uvicorn을 찾을 수 없습니다" 오류

**원인**: 가상환경이 활성화되지 않았습니다.

**해결**:
```cmd
venv\Scripts\activate.bat
```

가상환경이 활성화되면 프롬프트 앞에 `(venv)`가 표시됩니다.

### "activate.bat을 찾을 수 없습니다" 오류

**원인**: 잘못된 디렉토리에서 실행했습니다.

**해결**:
```cmd
cd 1team-project-rag\backend
```

### "No module named 'fastapi'" 오류

**원인**: 가상환경이 활성화되지 않았거나 패키지가 설치되지 않았습니다.

**해결**:
```cmd
REM 1. 가상환경 활성화
venv\Scripts\activate.bat

REM 2. 패키지 설치 확인
pip list

REM 3. 패키지 재설치 (필요시)
pip install -r requirements.txt
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

## 💡 CMD vs PowerShell

- **CMD**: `start_server.bat` 사용
- **PowerShell**: `start_server.ps1` 사용 (또는 수동 실행)

둘 다 같은 결과를 얻을 수 있습니다.

