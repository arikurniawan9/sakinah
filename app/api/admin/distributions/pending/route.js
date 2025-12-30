import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET: Get pending warehouse distributions for the store
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || ''; // Get search term

    // Define base where clause for pending distributions
    const baseWhereClause = {
      storeId: session.user.storeId,
      status: 'PENDING_ACCEPTANCE',
    };

    // First, get all pending distributions to then group them
    const allPendingDistributions = await prisma.warehouseDistribution.findMany({
      where: baseWhereClause,
      include: {
        distributedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        store: {
          select: {
            id: true,
            code: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          }
        },
      },
      orderBy: {
        distributedAt: 'desc',
      },
    });

    // Group distributions by invoice number
    const groupedDistributions = {};

    allPendingDistributions.forEach((dist) => {
      // Use invoice number as the key for grouping
      // If invoice number is missing, generate one based on the distribution details
      const invoiceNumber = dist.invoiceNumber || generateInvoiceNumber(dist);

      if (!groupedDistributions[invoiceNumber]) {
        groupedDistributions[invoiceNumber] = {
          id: dist.id, // Use the first distribution ID as the group ID
          invoiceNumber: invoiceNumber, // Use the invoice number
          distributedAt: dist.distributedAt,
          distributedByUserId: dist.distributedBy,
          distributedByUserName: dist.distributedByUser?.name || 'N/A',
          storeId: dist.storeId,
          items: [], // Array to hold individual items in this group
          totalQuantity: 0, // Total quantity for the group
          totalAmount: 0, // Total amount for the group
        };
      }

      // Add the current item to the group
      groupedDistributions[invoiceNumber].items.push({
        id: dist.id,
        productId: dist.productId,
        productName: dist.product?.name || 'N/A',
        productCode: dist.product?.productCode || 'N/A',
        quantity: dist.quantity,
        unitPrice: dist.unitPrice,
        totalAmount: dist.totalAmount,
      });

      // Update totals
      groupedDistributions[invoiceNumber].totalQuantity += dist.quantity;
      groupedDistributions[invoiceNumber].totalAmount += dist.totalAmount;
    });

    // Function to generate invoice number if not present
    function generateInvoiceNumber(dist) {
      const dateStr = new Date(dist.distributedAt).toISOString().split('T')[0].replace(/-/g, '');
      const storeCode = dist.store?.code?.replace(/\s+/g, '').toUpperCase() || 'N/A';
      const timestamp = dist.distributedAt.getTime().toString().slice(-4); // Use last 4 digits of timestamp
      return `D-${dateStr}-${storeCode}-${timestamp}`;
    }

    // Convert grouped object to array
    let distributions = Object.values(groupedDistributions);

    // Apply search filter to the grouped distributions
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      distributions = distributions.filter(dist =>
        dist.distributedByUserName.toLowerCase().includes(lowerCaseSearch) ||
        new Date(dist.distributedAt).toLocaleDateString('id-ID').toLowerCase().includes(lowerCaseSearch) ||
        dist.invoiceNumber.toLowerCase().includes(lowerCaseSearch) ||
        dist.items.some(item =>
          item.productName.toLowerCase().includes(lowerCaseSearch) ||
          item.productCode.toLowerCase().includes(lowerCaseSearch)
        )
      );
    }

    // Sort the grouped distributions by distributedAt (descending)
    distributions.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());

    const totalDistributions = distributions.length;
    const offset = (page - 1) * limit; // Reintroduce offset calculation
    const paginatedDistributions = distributions.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalDistributions / limit);

    return NextResponse.json({
      distributions: paginatedDistributions, // Return grouped distributions
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalDistributions,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalDistributions)
      }
    });
  } catch (error) {
    console.error('Error fetching pending warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}