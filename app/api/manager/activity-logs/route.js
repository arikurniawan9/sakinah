// app/api/manager/activity-logs/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Validasi input
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Parameter halaman atau batas tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Bangun where clause tanpa membatasi storeId
    const whereClause = {};

    if (userId) whereClause.userId = userId;
    if (action) whereClause.action = action;
    if (entity) whereClause.entity = entity;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true
            }
          },
          store: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    // Format waktu untuk tampilan
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      additionalData: log.additionalData,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      user: log.user,
      store: log.store,
      time: new Date(log.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      date: new Date(log.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));

    return new Response(JSON.stringify({
      logs: formattedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}