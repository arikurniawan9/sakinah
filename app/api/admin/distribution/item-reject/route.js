// app/api/admin/distribution/item-reject/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';

// PUT: Reject individual warehouse distribution item by admin
// Rejects a single distribution item (one product) while leaving others in the batch pending
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { distributionId, reason } = body; // Accept individual distribution item ID and rejection reason

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required' }, { status: 400 });
    }

    // Get the specific distribution item to reject
    const distributionItem = await prisma.warehouseDistribution.findUnique({
      where: {
        id: distributionId,
        storeId: session.user.storeId, // Ensure it's from the user's store
      },
    });

    if (!distributionItem) {
      return NextResponse.json({ error: 'Distribution item not found' }, { status: 404 });
    }

    if (distributionItem.status !== 'PENDING_ACCEPTANCE') {
      return NextResponse.json({ error: 'Distribution item is not pending acceptance' }, { status: 400 });
    }

    // Use transaction to ensure atomicity
    const updatedDistribution = await prisma.$transaction(async (tx) => {
      // Update distribution status to REJECTED
      const updatedDist = await tx.warehouseDistribution.update({
        where: { id: distributionItem.id },
        data: {
          status: 'REJECTED',
          notes: distributionItem.notes ? `${distributionItem.notes} | Rejected: ${reason || 'No reason provided'}` : `Rejected: ${reason || 'No reason provided'}`,
          updatedAt: new Date(),
        },
      });

      return updatedDist;
    });

    // Log audit for the rejected item
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistribution',
      entityId: distributionItem.id,
      newValue: { status: 'REJECTED', reason: reason || 'No reason provided' },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Individual distribution item rejected by store admin' }
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution item rejected successfully',
      distribution: updatedDistribution
    });
  } catch (error) {
    console.error('Error rejecting individual warehouse distribution item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}