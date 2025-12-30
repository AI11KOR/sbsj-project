@echo off
REM RAG 서버 실행 스크립트 (CMD용)
REM 이 스크립트를 실행하면 RAG 서버가 시작됩니다

REM -----------------------------
REM Encoding hints
REM -----------------------------
REM venv\\Scripts\\activate.bat already handles codepage internally.
REM Keep Python output in UTF-8 to reduce mojibake in logs.
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

echo ========================================
echo RAG 서버 시작 중...
echo ========================================
echo.

REM 현재 디렉토리 확인
cd /d "%~dp0"
echo 현재 디렉토리: %CD%
echo.

REM ========================================
REM If already inside a virtualenv, don't recreate/activate it again.
REM Recreating venv while (venv) is active can cause Permission denied on Windows.
REM ========================================
if defined VIRTUAL_ENV (
    echo [OK] 이미 가상환경이 활성화되어 있습니다: %VIRTUAL_ENV%
    goto :AFTER_VENV
)

REM 가상환경 경로 확인
if not exist "venv\Scripts\activate.bat" (
    echo [WARN] venv가 없습니다. venv를 자동 생성합니다...
    echo    (처음 1회는 시간이 걸릴 수 있습니다)
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] venv 생성 실패. python 설치/경로를 확인하세요.
        pause
        exit /b 1
    )
    echo [OK] venv 생성 완료
)

echo [OK] 가상환경 확인됨
echo.

REM 가상환경 활성화
echo 가상환경 활성화 중...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo [ERROR] 가상환경 활성화 실패
    pause
    exit /b 1
)

echo [OK] 가상환경 활성화 완료
echo.

:AFTER_VENV

REM .env 파일 확인
if not exist ".env" (
    echo [WARN] .env 파일이 없습니다. env.example을 .env로 자동 복사합니다...
    if exist "env.example" (
        copy /y "env.example" ".env" >nul
        echo [OK] .env 생성 완료. .env를 열고 OPENAI_API_KEY / TAVILY_API_KEY 를 채워주세요.
    ) else (
        echo [ERROR] env.example을 찾을 수 없습니다. env.example 파일이 필요합니다.
    )
    echo.
)

REM 의존성 설치 (처음 1회/변경 시 필요)
REM requirements.txt는 ASCII로 정리되어 CMD 인코딩 이슈가 없습니다.
set REQ_SIG=
for %%A in (requirements.txt) do set REQ_SIG=%%~zA_%%~tA

set PREV_SIG=
if exist ".deps_installed" (
    set /p PREV_SIG=<.deps_installed
)

if not "%REQ_SIG%"=="%PREV_SIG%" (
    echo [INFO] 의존성 설치/업데이트 중... (requirements.txt 변경 감지)
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] 의존성 설치 실패. 위 오류 로그를 확인하세요.
        pause
        exit /b 1
    )
    echo %REQ_SIG%> .deps_installed
) else (
    echo [OK] requirements.txt 변경 없음. 의존성 설치 스킵
)
echo.

REM 서버 시작
echo ========================================
echo RAG 서버 시작 (포트 8001)
echo ========================================
echo.
echo 서버 URL:
echo   - Health Check: http://localhost:8001/health
echo   - API 문서: http://localhost:8001/docs
echo   - 루트: http://localhost:8001/
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

REM uvicorn 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8001

pause

