# CyberCISO Backend

FastAPI backend for the CyberCISO virtual CISO application.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your OpenAI API key
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/chat` - Chat endpoint for interview and scorecard generation

## Running Tests

```bash
pytest
```

## Environment Variables

See `.env.example` for all required variables.