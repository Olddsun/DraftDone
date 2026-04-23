#!/bin/bash
# DraftDone 本地開發啟動腳本

echo "啟動後端 (FastAPI)..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "啟動前端 (Next.js)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "DraftDone 已啟動："
echo "  前端：http://localhost:3000"
echo "  後端：http://localhost:8000"
echo ""
echo "按 Ctrl+C 關閉"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
