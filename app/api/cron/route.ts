import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runRecurringJobs } from '@/lib/finance/automation';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; `x-cron-secret`
// is kept for manual/external triggers.
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;

  // Never authorize when the secret is not configured
  if (!expected) return false;

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const header = req.headers.get('x-cron-secret');
  const provided = bearer || header;

  return !!provided && safeEqual(provided, expected);
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await runRecurringJobs();
    return NextResponse.json({ success: true, message: 'Cron jobs executed' }, { status: 200 });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

// Vercel Cron invokes scheduled paths with GET
export const GET = handle;
export const POST = handle;
