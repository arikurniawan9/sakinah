// app/api/admin/distribution/batch-reject/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';

// PUT: Reject warehouse distribution batch by admin
// Rejects all distributions in the same batch (same date, same distributor, same store)
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
    const { distributionId, reason } = body; // Accept distribution ID to identify the batch and rejection reason

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required to identify the batch' }, { status: 400 });
    }

    // First, get the reference distribution to get the batch criteria (date, store, distributor)
    const referenceDistribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: distributionId,
        storeId: session.user.storeId, // Ensure it's from the user's store
      },
    });

    if (!referenceDistribution) {
      return NextResponse.json({ error: 'Reference distribution not found' }, { status: 404 });
    }

    // Get all distributions that belong to the same distribution batch/group
    // Based on the same invoice number
    // This ensures we only get distributions that were created together as a batch
    const distributionsToReject = await prisma.warehouseDistribution.findMany({
      where: {
        storeId: referenceDistribution.storeId,
        invoiceNumber: referenceDistribution.invoiceNumber, // Group by invoice number
        status: 'PENDING_ACCEPTANCE',
      },
    });

    if (distributionsToReject.length === 0) {
      return NextResponse.json({ error: 'No pending distributions found in this batch' }, { status: 404 });
    }

    // Use transaction to ensure atomicity for all distributions in the batch
    const updatedDistributions = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const distribution of distributionsToReject) {
        // Update distribution status to REJECTED
        const updatedDist = await tx.warehouseDistribution.update({
          where: { id: distribution.id },
          data: {
            status: 'REJECTED',
            notes: distribution.notes ? `${distribution.notes} | Rejected: ${reason || 'No reason provided'}` : `Rejected: ${reason || 'No reason provided'}`,
            updatedAt: new Date(),
          },
        });
        results.push(updatedDist);
      }
      return results;
    });

    // Log audit for the rejected batch
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistributionBatch',
      recordId: `${new Date(referenceDistribution.distributedAt).toISOString().split('T')[0]}-${referenceDistribution.distributedBy}-${referenceDistribution.storeId}`,
      newValue: { status: 'REJECTED', totalItemsRejected: updatedDistributions.length, reason: reason || 'No reason provided' },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Distribution batch rejected by store admin' }
    });

    return NextResponse.json({
      success: true,
      message: `${updatedDistributions.length} distribution(s) in the batch rejected successfully`,
      batchId: `${new Date(referenceDistribution.distributedAt).toISOString().split('T')[0]}-${referenceDistribution.distributedBy}`,
      distributions: updatedDistributions
    });
  } catch (error) {
    console.error('Error rejecting warehouse distribution batch:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}