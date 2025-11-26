import { NextRequest, NextResponse } from 'next/server';
import { runRecurringJobs } from '@/lib/finance/automation';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.headers.get('x-cron-secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run automation jobs
    await runRecurringJobs();

    return NextResponse.json({ success: true, message: 'Cron jobs executed' }, { status: 200 });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
