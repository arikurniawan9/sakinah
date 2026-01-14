// app/api/manager/activity-logs/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getActivityLogs } from '@/lib/auditTrail';
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
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const storeId = url.searchParams.get('storeId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Validasi input
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Parameter halaman atau batas tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entity) filters.entity = entity;
    if (storeId) filters.storeId = storeId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const logsData = await getActivityLogs(filters, page, limit);

    return new Response(JSON.stringify(logsData), {
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