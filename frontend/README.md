# CyberCISO Frontend

Next.js + Tailwind CSS frontend for the CyberCISO virtual CISO application.

## Setup

```bash
npm install
cp ../.env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production site to `out/` (static export)
- `npm run test` - Run Jest tests

> `next start` is not used here — the app deploys as a static export
> (`output: "export"`). For a local preview of the built site, serve the `out/`
> folder with any static server, e.g. `npx serve@latest out`.

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: same origin, e.g. `/api/v1/chat` on Vercel)

## Deployment

Deploy to Vercel (repo root `vercel.json` builds the static frontend and
deploys `api/index.py` as the Python function):

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.
Set `GROQ_API_KEY` in the project settings for live answers.