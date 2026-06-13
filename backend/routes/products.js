const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to format product with categories array
const formatProduct = (product) => {
  if (!product) return null;
  const { categories, ...rest } = product;
  return {
    ...rest,
    categories: categories ? categories.map((pc) => pc.category) : [],
  };
};

// @route   GET /api/products
// @desc    Get all products (with optional filter by category or search term)
router.get('/', verifyToken, async (req, res) => {
  const { search, categoryId } = req.query;

  try {
    let whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId) {
      whereClause.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = products.map(formatProduct);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(formatProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create a product (Admin only)
router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { name, sku, price, stock, description, imageUrl, categoryIds } = req.body;

  if (!name || !sku || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  try {
    // Check SKU duplicate
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ message: 'Product with this SKU already exists.' });
    }

    // Create Product
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
        imageUrl,
      },
    });

    // Create many-to-many ProductCategory relations
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const relationData = categoryIds.map((catId) => ({
        productId: product.id,
        categoryId: catId,
      }));
      await prisma.productCategory.createMany({
        data: relationData,
      });
    }

    // Retrieve created product with categories
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Emit live update for product inventory
    const io = req.app.get('io');
    if (io) {
      io.emit('product-change', { action: 'create', product: formatProduct(createdProduct) });
    }

    res.status(201).json(formatProduct(createdProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name, sku, price, stock, description, imageUrl, categoryIds } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check SKU duplicate on other products
    if (sku && sku !== product.sku) {
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        return res.status(400).json({ message: 'Product with this SKU already exists.' });
      }
    }

    // Update product properties
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : product.name,
        sku: sku !== undefined ? sku : product.sku,
        price: price !== undefined ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock, 10) : product.stock,
        description: description !== undefined ? description : product.description,
        imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
      },
    });

    // Update categories (delete and recreate)
    if (categoryIds && Array.isArray(categoryIds)) {
      await prisma.productCategory.deleteMany({
        where: { productId: id },
      });

      if (categoryIds.length > 0) {
        const relationData = categoryIds.map((catId) => ({
          productId: id,
          categoryId: catId,
        }));
        await prisma.productCategory.createMany({
          data: relationData,
        });
      }
    }

    // Get fully updated product
    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Emit live update for product inventory
    const io = req.app.get('io');
    if (io) {
      io.emit('product-change', { action: 'update', product: formatProduct(fullProduct) });
    }

    res.json(formatProduct(fullProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await prisma.product.delete({ where: { id } });

    // Emit live update
    const io = req.app.get('io');
    if (io) {
      io.emit('product-change', { action: 'delete', id });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
