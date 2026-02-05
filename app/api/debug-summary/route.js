// Debug endpoint untuk memeriksa akses ke summary
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ 
    message: "Debug endpoint works",
    timestamp: new Date().toISOString()
  });
}