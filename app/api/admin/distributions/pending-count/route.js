import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import initRedisClient from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has storeId
    if (!session.user.storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Generate cache key
    const cacheKey = `pending_distributions_count:${session.user.storeId}`;
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
          console.log('Cache hit for pending distributions count');
          return NextResponse.json({ pendingDistributions: cachedData });
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error.message);
      }
    }

    // Count pending warehouse distributions for this store
    const pendingDistributions = await prisma.warehouseDistribution.count({
      where: {
        storeId: session.user.storeId,
        status: 'PENDING_ACCEPTANCE',
      },
    });

    const result = {
      pendingDistributions: pendingDistributions || 0
    };

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(result.pendingDistributions), { EX: 120 }); // Cache for 2 minutes
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pending distributions count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}