import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { notificationManager } from '@/lib/notificationManager';
import initRedisClient from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Generate cache key
    const cacheKey = `notification_unread_count:${userId}`;
    let redisClient;
    try {
      redisClient = await initRedisClient();
    } catch (error) {
      console.warn('Redis not available, proceeding without caching:', error.message);
    }

    // Try to get cached data
    let cachedData = null;
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          cachedData = JSON.parse(cached);
          console.log('Cache hit for unread notification count');
          return NextResponse.json({ unreadCount: cachedData });
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error.message);
      }
    }

    const unreadCount = await notificationManager.getUnreadNotificationCount(userId);

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(unreadCount), { EX: 60 }); // Cache for 1 minute
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
    }

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}