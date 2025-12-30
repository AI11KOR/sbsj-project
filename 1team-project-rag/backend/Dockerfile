FROM python:3.11-slim

WORKDIR /app

# (선택) 빌드에 필요한 패키지
RUN apt-get update && apt-get install -y gcc g++ \
 && rm -rf /var/lib/apt/lists/*

# ✅ 의존성 설치 (루트 컨텍스트 기준)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# ✅ 소스 복사 (backend만 /app/backend로)
COPY backend /app/backend

# ✅ 파이썬 모듈 경로 고정
ENV PYTHONPATH=/app/backend

EXPOSE 8001

# ✅ uvicorn 실행 (backend/main.py 안의 app)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
