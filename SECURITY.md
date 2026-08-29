# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest release on the `main` branch receives security updates. We recommend always deploying from the latest commit or tagged release.

## Reporting a Vulnerability

We take the security of CyberCISO seriously. If you discover a security vulnerability, please follow responsible disclosure:

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities.
2. Email the maintainers directly or use GitHub's **Private vulnerability reporting** (Security > Report a vulnerability) on this repository.
3. Include:
   - Description of the vulnerability and potential impact
   - Steps to reproduce (PoC, request/response, screenshots)
   - Affected component(s) — `backend` (FastAPI), `frontend` (Next.js), `api`, or infrastructure (`vercel.json`, `docker-compose.yml`)
   - Your environment (version/commit hash, deployment target)

### What to Expect

- **Acknowledgement** within **48 hours**.
- **Initial triage and severity assessment** within **5 business days**.
- **Fix and disclosure timeline** communicated based on severity (critical issues are prioritized).
- You will be notified when the fix is released. Credit will be given if desired.

### Disclosure Policy

- Please give us reasonable time to investigate and remediate before any public disclosure.
- We follow coordinated disclosure and will publish a GitHub Security Advisory once a fix is available.

## Security Practices in This Project

### Architecture & Data Handling

- **Zero-persistence design**: Sensitive interview data is not persisted to a database. Conversation state is kept client-side and in short-lived server memory only.
- **AI boundary**: System prompts strictly anchor output to NIST CSF 2.0 and CIS Controls v8 to reduce prompt-injection and hallucination risk. User input is never interpolated directly into privileged prompts without validation.
- **PDF export** is rendered client-side (in-browser, view-only); no server-side file storage.

### Application Security

- **Input validation & sanitization**: All backend inputs are validated with Pydantic schemas (`backend/app/models/schemas.py`) and sanitized server-side.
- **CORS**: FastAPI CORS is restricted via `FRONTEND_URL` (`backend/app/main.py` / `backend/app/core/config.py`). Do not set `allow_origins=["*"]` in production.
- **Secrets management**: API keys (`OPENAI_API_KEY`, `GROQ_API_KEY`, etc.) are loaded exclusively from environment variables. Never commit `.env` files — they are ignored via `.gitignore`. Use `.env.example` as a template.
- **Error handling**: Generic error responses are returned to clients; stack traces and upstream provider details (OpenAI/Groq rate limits, timeouts) are logged server-side only.
- **Type safety**: TypeScript on the frontend and Pydantic + type hints on the backend reduce injection and logic-error classes.

### Dependency & Supply Chain

- Pin backend dependencies in `backend/requirements.txt` and frontend dependencies in `frontend/package.json`.
- Review Dependabot / `npm audit` / `pip-audit` findings before merging.
- Docker images build from explicit `Dockerfile`s; avoid `latest` tags in production.

### Deployment Hardening Checklist

- [ ] Set `ENVIRONMENT=production` and enforce HTTPS (Vercel for frontend, Render/Railway for backend).
- [ ] Rotate `OPENAI_API_KEY` / `GROQ_API_KEY` and store only in the hosting provider's secret manager (Vercel Environment Variables, Render Secrets, etc.).
- [ ] Configure `FRONTEND_URL` to the exact production frontend origin — no wildcard.
- [ ] Enable rate limiting / WAF at the edge (Vercel Firewall, Cloudflare, or FastAPI middleware) for `/api/v1/chat`.
- [ ] Set secure headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) at the reverse proxy / Vercel config.
- [ ] Disable FastAPI docs (`/docs`, `/redoc`, `/openapi.json`) in production if not needed.
- [ ] Keep `tiktoken` / `llmlingua` and other AI pipeline deps updated; monitor OpenAI/Groq SDK changelogs for deprecations.

### For Contributors

- Never log or commit secrets, tokens, or interview transcripts.
- Validate and sanitize all new inputs; add Pydantic models and tests.
- Keep token counting (`tiktoken`) and prompt compression (`llmlingua`) thresholds configurable via env vars (`TOKEN_THRESHOLD`, `TARGET_TOKEN_BUDGET`) — do not hardcode.
- Run `npm audit` and `pip audit` / `safety check` locally before submitting a PR that changes dependencies.
- Prefer least-privilege for any new API routes or middleware.

## Scope

This policy covers code in this repository (`backend/`, `frontend/`, `api/`, configuration and deployment files). Third-party services (OpenAI, Groq, Vercel, Render/Railway) are governed by their own security policies.

## References

- NIST CSF 2.0: https://csf.tools/
- CIS Controls v8: https://www.cisecurity.org/controls
- GitHub Private vulnerability reporting: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability
