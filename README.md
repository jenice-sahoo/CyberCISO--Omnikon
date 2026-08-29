# CyberCISO

A web-based, on-demand "Virtual CISO" that runs short, adaptive, plain-language chat interviews tailored to a small business's vertical. Outputs a security scorecard (A–F letter grade) and a 30-day prioritized remediation plan, strictly anchored to NIST CSF 2.0 and CIS Controls v8.

## Tech Stack

- **Frontend**: Next.js + Tailwind CSS → Vercel
- **Backend**: Python + FastAPI → Render/Railway
- **AI**: Groq API (`llama-3.1-8b-instant`), `tiktoken` token counting, `llmlingua` prompt compression

## Architecture

1. User message → Next.js chat UI
2. Next.js sends message + hidden system prompt → FastAPI
3. FastAPI counts tokens via `tiktoken`
4. If count > threshold, compress via `llmlingua` down to target budget
5. Send optimized prompt → Groq API (`llama-3.1-8b-instant`)
6. Return response → Next.js rendersthi

## Project Structure

```
CyberCISO/
├── api/                       # Vercel Python serverless function (FastAPI)
│   ├── index.py
│   └── requirements.txt
├── backend/                   # Full FastAPI backend (Render/Railway/local Docker)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── chat.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── openai_client.py
│   │   │   ├── token_counter.py
│   │   │   └── prompt_compressor.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   └── prompts/
│   │       └── system_prompt.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  # Next.js + Tailwind UI (static export → Vercel)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── vercel.json
├── .env.example
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your OpenAI API key
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Features

- Dynamic branching interview tailored per vertical (retail, healthcare clinic, professional services)
- Structured scorecard output with 30-day remediation plan
- JSON schema for reliable frontend rendering
- System prompt enforces NIST CSF 2.0 / CIS Controls v8 bound output
- Zero-persistence: sensitive data not stored in DB; conversation state client-side + short-lived server memory
- Robust error handling for Groq API failures/rate limits/timeouts
- Secrets via env vars; input validation/sanitization server-side
- Type-safe: TypeScript frontend, type hints + Pydantic backend
- Mobile-responsive UI
- Mock Groq API response mode for local dev (runs without live API key)
- PDF export; results view-only in-browser

## Verticals (Launch)

1. Retail
2. Healthcare Clinic
3. Professional Services

## Scorecard Sub-categories (Equally Weighted)

1. Access Control
2. Data Backup
3. Network Security
4. Email/Phishing Readiness
5. Incident Response

## Interview Length

~8–12 adaptive questions

## Deployment

### Vercel (frontend + API)

One project serves both the static frontend and the Python API:

- The Next.js app is built with `output: "export"` (`npm run build` → `frontend/out`).
- `api/index.py` is deployed as a file-based Python function (FastAPI `app`).
- `vercel.json` routes `/api/*` and `/health` to the Python function; everything
  else is served from the static frontend build.
- Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) as an environment variable in
  the Vercel project so the chat endpoint answers real questions instead of the
  built-in mock script.

### Backend

- Backend: Render or Railway (see `backend/render.yaml` / `backend/railway.toml`)
- Local: `docker compose up`
