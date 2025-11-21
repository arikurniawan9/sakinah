// app/api/throttle-status/route.js
import { NextResponse } from 'next/server';
import { getLockoutTimeRemaining, formatLockoutTime } from '@/lib/loginSecurity';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('id') || 'default';
  
  const timeRemaining = getLockoutTimeRemaining(identifier);
  
  return NextResponse.json({
    isLocked: timeRemaining > 0,
    timeRemaining: timeRemaining,
    formattedTime: timeRemaining > 0 ? formatLockoutTime(timeRemaining) : null
  });
}

export async function POST(request) {
  const { action, identifier = 'default' } = await request.json();
  
  switch (action) {
    case 'check':
      const timeRemaining = getLockoutTimeRemaining(identifier);
      return NextResponse.json({
        isLocked: timeRemaining > 0,
        timeRemaining: timeRemaining,
        formattedTime: timeRemaining > 0 ? formatLockoutTime(timeRemaining) : null
      });
      
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}