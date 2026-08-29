import { ChatRequest, ChatResponse, ScorecardResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const base = API_BASE || '';
  const response = await fetch(`${base}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let detail = `HTTP ${response.status}`;
    try {
      const error = JSON.parse(text);
      if (typeof error.detail === 'string') detail = error.detail;
      else if (Array.isArray(error.detail)) detail = error.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      else if (error.detail) detail = JSON.stringify(error.detail);
      else if (text) detail = text.slice(0, 500);
    } catch {
      if (text) detail = text.slice(0, 500);
    }
    // Include status so Vercel 500 HTML is not swallowed as "Unknown error"
    throw new Error(`${detail} (status ${response.status})`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const base = API_BASE || '';
  const response = await fetch(`${base}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}
