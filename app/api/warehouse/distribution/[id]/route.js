// app/api/warehouse/distribution/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// PUT /api/warehouse/distribution/[id] - Update distribution status (accept/reject)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only MANAGER, ADMIN or STORE-specific roles can update distribution status
    if (!['MANAGER', 'ADMIN', 'CASHIER', 'ATTENDANT'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params; // Distribution ID from URL
    const { status, notes } = await request.json(); // New status and optional notes

    if (!id || !status) {
      return NextResponse.json({ error: 'ID distribusi dan status wajib disediakan' }, { status: 400 });
    }

    // Check if the distribution exists and belongs to the user's store
    let distribution = await prisma.warehouseDistribution.findFirst({
      where: {
        id: id,
        storeId: session.user.storeId, // Ensure it's for the user's store
      },
      include: {
        product: true,
        store: true,
      }
    });

    if (!distribution) {
      return NextResponse.json({ error: 'Distribusi tidak ditemukan atau tidak terkait dengan toko Anda' }, { status: 404 });
    }

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid. Gunakan ACCEPTED atau REJECTED' }, { status: 400 });
    }

    // Use a transaction to ensure atomicity
    const updatedDistribution = await prisma.$transaction(async (tx) => {
      // Update the distribution status
      const updatedDist = await tx.warehouseDistribution.update({
        where: { id },
        data: {
          status: status,
          notes: notes || distribution.notes, // Keep existing notes if not provided
        },
      });

      // If accepted, add the products to the store's stock
      if (status === 'ACCEPTED') {
        // Find or create store product
        let storeProduct = await tx.storeProduct.findUnique({
          where: {
            productId_storeId: {
              productId: distribution.productId,
              storeId: distribution.storeId,
            }
          }
        });

        if (storeProduct) {
          // Update existing store product quantity
          await tx.storeProduct.update({
            where: {
              productId_storeId: {
                productId: distribution.productId,
                storeId: distribution.storeId,
              }
            },
            data: {
              quantity: {
                increment: distribution.quantity,
              }
            }
          });
        } else {
          // Create new store product if it doesn't exist
          await tx.storeProduct.create({
            data: {
              productId: distribution.productId,
              storeId: distribution.storeId,
              quantity: distribution.quantity,
              reserved: 0, // No reserved quantity initially
            }
          });
        }

        // Create stock log entry
        await tx.stockLog.create({
          data: {
            productId: distribution.productId,
            storeId: distribution.storeId,
            type: 'IN',
            quantity: distribution.quantity,
            description: `Penerimaan dari gudang (Distribusi ID: ${distribution.id})`,
            referenceId: distribution.id,
            createdById: session.user.id,
          }
        });
      }

      return updatedDist;
    });

    return NextResponse.json({
      success: true,
      distribution: updatedDistribution,
      message: status === 'ACCEPTED' 
        ? 'Distribusi diterima dan stok toko telah diperbarui' 
        : 'Distribusi ditolak',
    });
  } catch (error) {
    console.error('Error updating distribution status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/warehouse/distribution/[id] - Delete a distribution (only for pending distributions)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER can delete distributions
    if (session.user.role !== 'WAREHOUSE' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params; // Distribution ID from URL

    // Check if the distribution exists and is still pending
    const distribution = await prisma.warehouseDistribution.findFirst({
      where: {
        id: id,
        status: 'PENDING_ACCEPTANCE',
      }
    });

    if (!distribution) {
      return NextResponse.json({ error: 'Distribusi tidak ditemukan atau sudah diproses' }, { status: 404 });
    }

    // Use a transaction to ensure atomicity
    const deletedDistribution = await prisma.$transaction(async (tx) => {
      // First, restore the quantity back to the warehouse
      await tx.warehouseProduct.update({
        where: {
          productId_warehouseId: {
            productId: distribution.productId,
            warehouseId: distribution.warehouseId,
          },
        },
        data: {
          quantity: {
            increment: distribution.quantity,
          },
        },
      });

      // Then delete the distribution record
      const deletedDist = await tx.warehouseDistribution.delete({
        where: { id },
      });

      return deletedDist;
    });

    return NextResponse.json({
      success: true,
      distribution: deletedDistribution,
      message: 'Distribusi berhasil dibatalkan dan stok gudang dikembalikan',
    });
  } catch (error) {
    console.error('Error deleting distribution:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}