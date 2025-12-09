import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// PUT: Accept warehouse distribution by store admin
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
    const { distributionId } = body;

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required' }, { status: 400 });
    }

    // Find the pending distribution for this store
    const distribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: distributionId,
        storeId: session.user.storeId,
        status: 'PENDING_ACCEPTANCE',
      },
      include: {
        product: true,
        warehouse: true,
        store: true,
      }
    });

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found or already processed' }, { status: 404 });
    }

    // Use transaction to ensure atomicity
    const updatedDistribution = await prisma.$transaction(async (tx) => {
      // Update distribution status to ACCEPTED
      const updatedDist = await tx.warehouseDistribution.update({
        where: { id: distributionId },
        data: {
          status: 'ACCEPTED',
          updatedAt: new Date(),
        },
        include: {
          product: true,
          distributedByUser: true,
          store: true,
          warehouse: true,
        }
      });

      // Create a purchase record for the store to represent this accepted distribution
      const purchase = await tx.purchase.create({
        data: {
          storeId: session.user.storeId,
          supplierId: distribution.product.supplierId, // Use the product's original supplier
          userId: session.user.id, // Admin who accepted the distribution
          purchaseDate: new Date(distribution.distributedAt), // Use the original distribution date
          totalAmount: distribution.totalAmount,
          status: 'COMPLETED', // The purchase is completed since it's an accepted distribution
          isDistribution: true, // Mark this as a distribution from warehouse
          items: {
            create: {
              storeId: session.user.storeId,
              productId: distribution.productId,
              quantity: distribution.quantity,
              purchasePrice: distribution.unitPrice,
              subtotal: distribution.totalAmount,
            }
          }
        },
        include: {
          supplier: true,
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update product stock in the store
      await tx.product.update({
        where: {
          id: distribution.productId,
          storeId: session.user.storeId
        },
        data: {
          stock: {
            increment: distribution.quantity
          }
        }
      });

      return updatedDist;
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution accepted successfully',
      distribution: updatedDistribution
    });
  } catch (error) {
    console.error('Error accepting warehouse distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Reject warehouse distribution by store admin
export async function PATCH(request) {
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
    const { distributionId, reason } = body;

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required' }, { status: 400 });
    }

    // Find the pending distribution for this store
    const distribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: distributionId,
        storeId: session.user.storeId,
        status: 'PENDING_ACCEPTANCE',
      }
    });

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found or already processed' }, { status: 404 });
    }

    // Update distribution status to REJECTED
    const updatedDistribution = await prisma.warehouseDistribution.update({
      where: { id: distributionId },
      data: {
        status: 'REJECTED',
        notes: reason ? `${distribution.notes || ''} | Reason: ${reason}` : distribution.notes,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution rejected successfully',
      distribution: updatedDistribution
    });
  } catch (error) {
    console.error('Error rejecting warehouse distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}