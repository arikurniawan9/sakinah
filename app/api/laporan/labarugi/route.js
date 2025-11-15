// app/api/laporan/labarugi/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the whole day

    // Fetch total sales within the date range
    const salesResult = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(total), 0) as totalSales,
        COUNT(*) as totalTransactions
      FROM Sale
      WHERE createdAt >= ${startDate} 
      AND createdAt <= ${endDate}
    `;

    const totalSales = Number(salesResult[0]?.totalSales || 0);
    const totalTransactions = Number(salesResult[0]?.totalTransactions || 0);

    // Fetch total expenses within the date range
    const expensesResult = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0) as totalExpenses
      FROM Expense
      WHERE date >= ${startDate} 
      AND date <= ${endDate}
    `;

    const totalExpenses = Number(expensesResult[0]?.totalExpenses || 0);

    // Calculate net profit/loss
    const netProfit = totalSales - totalExpenses;

    // Fetch daily sales and expenses for chart
    const salesByDay = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as saleDate,
        SUM(total) as dailySales,
        COUNT(*) as transactionCount
      FROM Sale
      WHERE createdAt >= ${startDate} 
      AND createdAt <= ${endDate}
      GROUP BY DATE(createdAt)
      ORDER BY saleDate ASC
    `;

    const expensesByDay = await prisma.$queryRaw`
      SELECT 
        DATE(date) as expenseDate,
        SUM(amount) as dailyExpenses
      FROM Expense
      WHERE date >= ${startDate} 
      AND date <= ${endDate}
      GROUP BY DATE(date)
      ORDER BY expenseDate ASC
    `;

    // Combine sales and expenses data by date
    const dailyData = [];
    const datesSet = new Set();

    // Add all unique dates to the set
    salesByDay.forEach(record => datesSet.add(record.saleDate));
    expensesByDay.forEach(record => datesSet.add(record.expenseDate));

    const sortedDates = Array.from(datesSet).sort();

    for (const date of sortedDates) {
      const saleRecord = salesByDay.find(r => r.saleDate === date);
      const expenseRecord = expensesByDay.find(r => r.expenseDate === date);

      dailyData.push({
        date: date,
        sales: Number(saleRecord?.dailySales || 0),
        expenses: Number(expenseRecord?.dailyExpenses || 0),
        profit: Number(saleRecord?.dailySales || 0) - Number(expenseRecord?.dailyExpenses || 0),
        transactions: Number(saleRecord?.transactionCount || 0)
      });
    }

    // Format the daily data for charts
    const chartData = dailyData.map(day => ({
      name: new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      sales: day.sales,
      expenses: day.expenses,
      profit: day.profit,
      transactions: day.transactions,
      fullDate: day.date
    }));

    return NextResponse.json({
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        totalTransactions
      },
      dailyData: chartData
    });

  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit/loss report data' },
      { status: 500 }
    );
  }
}