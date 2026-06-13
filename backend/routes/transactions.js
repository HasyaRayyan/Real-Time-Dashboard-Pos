const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to generate Invoice Number (e.g. INV-20260613-1002)
const generateInvoiceNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${date}`;

  // Find count of transactions today to increment index
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const todayTxCount = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const nextIndex = String(todayTxCount + 1).padStart(4, '0');
  return `INV-${dateStr}-${nextIndex}`;
};

// @route   POST /api/transactions/checkout
// @desc    Perform a checkout transaction (POS)
router.post('/checkout', verifyToken, async (req, res) => {
  const { items, paymentMethod, amountPaid } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty.' });
  }

  if (!paymentMethod || amountPaid === undefined) {
    return res.status(400).json({ message: 'Payment method and amount paid are required.' });
  }

  try {
    const invoiceNumber = await generateInvoiceNumber();

    // Use Prisma transaction to ensure all db steps complete atomically
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const transactionItemsToCreate = [];
      const stockUpdates = [];

      // Validate products and check stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}. Stock left: ${product.stock}`);
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        transactionItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          subtotal: subtotal,
        });

        // Track stock decrement
        stockUpdates.push({
          id: product.id,
          newStock: product.stock - item.quantity,
        });
      }

      if (amountPaid < totalAmount && paymentMethod === 'CASH') {
        throw new Error(`Insufficient paid amount. Total: Rp ${totalAmount}, Paid: Rp ${amountPaid}`);
      }

      const changeAmount = paymentMethod === 'CASH' ? amountPaid - totalAmount : 0;

      // 1. Decrement stock for all products
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: { stock: update.newStock },
        });
      }

      // 2. Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          totalAmount,
          paymentMethod,
          amountPaid: parseFloat(amountPaid),
          changeAmount,
          cashierId: req.user.id,
          items: {
            create: transactionItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          cashier: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      });

      return transaction;
    });

    // Successfully checked out! Broadcast events via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Broadcast new transaction event for real-time dashboard
      io.emit('new-transaction', result);

      // Broadcast stock updates
      for (const item of result.items) {
        const fullProduct = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });
        const formatted = {
          ...fullProduct,
          categories: fullProduct.categories.map(c => c.category)
        };
        io.emit('product-change', { action: 'update', product: formatted });
      }
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Checkout failed.' });
  }
});

// @route   GET /api/transactions
// @desc    Get transaction history
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        cashier: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
