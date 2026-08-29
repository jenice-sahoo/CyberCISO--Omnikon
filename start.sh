#!/bin/bash
cd frontend && npm run dev &
cd backend && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
wait