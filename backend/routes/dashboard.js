const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard metrics & charts (Admin only)
router.get('/stats', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const now = new Date();
    
    // Today date ranges
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Yesterday date ranges
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(endOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Current Month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch Today's Transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const todayRevenue = todayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    const todaySalesCount = todayTransactions.length;

    // 2. Fetch Yesterday's Transactions
    const yesterdayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
      },
    });

    const yesterdayRevenue = yesterdayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

    // 3. Fetch Monthly Revenue
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
    const monthlyRevenue = monthlyTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

    // 4. Low stock products (stock < 10)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lt: 10,
        },
      },
      orderBy: { stock: 'asc' },
    });

    // 5. Popular products calculation (Top 5)
    // We group TransactionItems by productId, sum quantity
    const itemsAggregation = await prisma.transactionItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const popularProducts = [];
    for (const agg of itemsAggregation) {
      const product = await prisma.product.findUnique({
        where: { id: agg.productId },
      });
      if (product) {
        popularProducts.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          sold: agg._sum.quantity || 0,
          revenue: (agg._sum.quantity || 0) * product.price,
        });
      }
    }

    // 6. Recent 5 Transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      include: {
        cashier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 7. Last 7 Days Revenue Trend for Charting
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayTx = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const dayRevenue = dayTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateString = `${d.getDate()}/${d.getMonth() + 1}`;

      last7DaysData.push({
        day: `${dayName} (${dateString})`,
        revenue: dayRevenue,
        sales: dayTx.length,
      });
    }

    // 8. Overall Product and Category Count
    const totalProductsCount = await prisma.product.count();
    const totalCategoriesCount = await prisma.category.count();

    res.json({
      metrics: {
        todayRevenue,
        todaySalesCount,
        yesterdayRevenue,
        monthlyRevenue,
        revenueGrowthPercent: yesterdayRevenue === 0 
          ? (todayRevenue > 0 ? 100 : 0) 
          : Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100),
        totalProductsCount,
        totalCategoriesCount,
      },
      lowStockProducts,
      popularProducts,
      recentTransactions,
      salesTrend: last7DaysData,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
