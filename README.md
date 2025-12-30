환경변수가 반드시 필요합니다 참고

## 실행 방법
- frontend
- backend
- rag
- ai

### Frontend
cd 1team-project-frontend
npm install
npm run dev

### Backend
cd 1team-project-backend
npm install
npm run dev


### ai
cd 1team-project-ai
npm install
python app.py

### rag
cd 1team-project-rag
npm install

## 임베딩 요청
uvicorn main:app --reload --port 8001
python rag/embedding.py

cd backend
start_server.bat



