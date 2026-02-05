// Debug endpoint untuk summary
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ 
    totalStores: 5,
    totalMembers: 50,
    totalProducts: 100,
    todaySales: 1500000
  });
}