const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to create slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', verifyToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create a category (Admin only)
router.post('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const slug = slugify(name);

  try {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category (Admin only)
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const slug = slugify(name);

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check duplicate name on other categories
    const duplicate = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ name }, { slug }] },
        ],
      },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Category name already taken' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (Admin only)
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
