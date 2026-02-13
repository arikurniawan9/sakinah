import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.ADMIN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'monthly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter based on time range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        returnDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      };
    } else {
      // Default: last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      dateFilter = {
        returnDate: {
          gte: sixMonthsAgo,
        }
      };
    }

    // Get all return products with related data
    const returnProducts = await prisma.returnProduct.findMany({
      where: dateFilter,
      include: {
        store: true,
        transaction: {
          include: {
            saleDetails: true,
            cashier: true,
          },
        },
        product: {
          include: {
            category: true
          }
        },
        attendant: true,
      }
    });

    // Calculate summary statistics
    const totalReturns = returnProducts.length;
    const totalApproved = returnProducts.filter(rp => rp.status === 'APPROVED').length;
    const totalRejected = returnProducts.filter(rp => rp.status === 'REJECTED').length;
    
    // Calculate total value (based on product prices in transactions)
    let totalValue = 0;
    returnProducts.forEach(rp => {
      if (rp.transaction && rp.transaction.saleDetails) {
        const saleDetail = rp.transaction.saleDetails.find(sd => sd.productId === rp.productId);
        if (saleDetail) {
          totalValue += saleDetail.price * saleDetail.quantity;
        }
      }
    });

    // Calculate average processing time (difference between createdAt and updatedAt)
    let totalProcessingTime = 0;
    let processedReturns = 0;
    returnProducts.forEach(rp => {
      if (rp.status !== 'PENDING') {
        const processingTime = (new Date(rp.updatedAt).getTime() - new Date(rp.createdAt).getTime()) / (1000 * 60 * 60 * 24); // in days
        totalProcessingTime += processingTime;
        processedReturns++;
      }
    });
    const avgProcessingTime = processedReturns > 0 ? totalProcessingTime / processedReturns : 0;

    // Group by category
    const categoryCounts = {};
    returnProducts.forEach(rp => {
      const categoryName = rp.product?.category?.name || 'Kategori Tidak Diketahui';
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    const byCategory = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      value: count,
      count
    }));

    // Group by attendant
    const attendantCounts = {};
    returnProducts.forEach(rp => {
      const attendantName = rp.attendant?.name || 'Nama Tidak Tersedia';
      if (!attendantCounts[attendantName]) {
        attendantCounts[attendantName] = { returns: 0, approved: 0, rejected: 0 };
      }
      attendantCounts[attendantName].returns++;
      if (rp.status === 'APPROVED') {
        attendantCounts[attendantName].approved++;
      } else if (rp.status === 'REJECTED') {
        attendantCounts[attendantName].rejected++;
      }
    });

    const byAttendant = Object.entries(attendantCounts).map(([name, data]) => ({
      name,
      returns: data.returns,
      approved: data.approved,
      rejected: data.rejected
    }));

    // Group by month
    const monthlyData = {};
    returnProducts.forEach(rp => {
      const monthYear = new Date(rp.returnDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric'
      });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { returns: 0, approved: 0, rejected: 0 };
      }
      
      monthlyData[monthYear].returns++;
      if (rp.status === 'APPROVED') {
        monthlyData[monthYear].approved++;
      } else if (rp.status === 'REJECTED') {
        monthlyData[monthYear].rejected++;
      }
    });

    const byMonth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      returns: data.returns,
      approved: data.approved,
      rejected: data.rejected
    })).sort((a, b) => new Date(a.month) - new Date(b.month)); // Sort by date

    const reportData = {
      summary: {
        totalReturns,
        totalApproved,
        totalRejected,
        totalValue,
        avgProcessingTime: parseFloat(avgProcessingTime.toFixed(1))
      },
      byCategory,
      byAttendant,
      byMonth
    };

    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching return product report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}