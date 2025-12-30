# # Python 3.11 슬림 이미지 사용
# FROM python:3.11-slim

# # 작업 디렉토리 설정
# WORKDIR /app

# # 시스템 패키지 업데이트 및 필요한 패키지 설치
# # pyproj를 위한 PROJ 라이브러리 필요
# RUN apt-get update && apt-get install -y \
#     gcc \
#     g++ \
#     libproj-dev \
#     proj-data \
#     proj-bin \
#     && rm -rf /var/lib/apt/lists/*

# # pip 업그레이드
# RUN pip install --upgrade pip

# # requirements.txt 복사 및 의존성 설치
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# # 애플리케이션 파일 복사
# # 변경 전: COPY app.py . / COPY models/ ./models/ (인구2.xlsx 등 데이터 파일 누락)
# # 변경 후: 필요한 데이터 파일도 함께 복사
# COPY app.py .
# COPY models/ ./models/
# # app.py에서 사용하는 인구2.xlsx 파일 복사
# COPY 인구2.xlsx .

# # Flask 포트 노출
# EXPOSE 5000

# # 환경 변수 설정
# ENV FLASK_APP=app.py
# ENV PYTHONUNBUFFERED=1

# # Flask 앱 실행
# CMD ["python", "app.py"]

# Python 3.11 slim
FROM python:3.11-slim

WORKDIR /app

# 필수 시스템 패키지 (pyproj + lightgbm 빌드 대비)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    cmake \
    libproj-dev \
    proj-data \
    proj-bin \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# 의존성 먼저 설치 (캐시)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 소스
COPY app.py .
COPY models/ ./models/
COPY data/ ./data/
COPY 인구2.xlsx .

EXPOSE 5000
ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app", "--workers", "2", "--timeout", "180"]
