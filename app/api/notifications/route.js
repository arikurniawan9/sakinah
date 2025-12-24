import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { notificationManager } from '@/lib/notificationManager';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const acknowledged = searchParams.get('acknowledged');

    const filters = {
      ...(type && { type }),
      ...(severity && { severity }),
      ...(acknowledged !== undefined && { acknowledged: acknowledged === 'true' }),
    };

    const userId = session.user.id;
    const storeId = session.user.storeId;

    let notificationsData;

    // Depending on the user role, fetch user-specific or store-specific notifications
    // For now, let's fetch store-specific notifications if storeId is present, otherwise user-specific
    if (storeId) {
      notificationsData = await notificationManager.getStoreNotifications(storeId, filters, { page, limit });
    } else if (userId) {
      notificationsData = await notificationManager.getUserNotifications(userId, filters, { page, limit });
    } else {
      return NextResponse.json({ error: 'User or Store ID not found in session' }, { status: 400 });
    }
    
    return NextResponse.json(notificationsData);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const acknowledgedNotification = await notificationManager.acknowledgeNotification(notificationId, session.user.id);

    return NextResponse.json({ success: true, notification: acknowledgedNotification });

  } catch (error) {
    console.error('Error acknowledging notification:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
