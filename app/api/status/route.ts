import { NextResponse } from 'next/server';
import { liveApiEnabled } from '@/lib/live-access';
export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({
    configured: liveApiEnabled() && Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    maxLocalCalls: Math.min(100, Math.max(1, Number.parseInt(process.env.CONTENTSIGNAL_MAX_API_CALLS || '3', 10) || 3)),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
