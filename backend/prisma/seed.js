const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
  const cashierPasswordHash = await bcrypt.hash('kasirpassword', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      name: 'Administrator',
      role: 'ADMIN',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      username: 'kasir',
      passwordHash: cashierPasswordHash,
      name: 'Kasir POS',
      role: 'CASHIER',
    },
  });

  console.log('Created Users:', { admin: admin.username, cashier: cashier.username });

  // 3. Create Categories
  const categoriesData = [
    { name: 'Makanan', slug: 'makanan' },
    { name: 'Minuman', slug: 'minuman' },
    { name: 'Kopi', slug: 'kopi' },
    { name: 'Cemilan', slug: 'cemilan' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: cat,
    });
    categories[created.slug] = created;
  }

  console.log('Created Categories:', Object.keys(categories));

  // 4. Create Products
  const productsData = [
    {
      name: 'Nasi Goreng Special',
      sku: 'NSG-001',
      price: 25000,
      stock: 50,
      description: 'Nasi goreng dengan telur mata sapi dan ayam suwir.',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['makanan'],
    },
    {
      name: 'Mie Goreng Seafood',
      sku: 'MIG-002',
      price: 28000,
      stock: 40,
      description: 'Mie goreng dengan udang, cumi, dan bakso ikan.',
      imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['makanan'],
    },
    {
      name: 'Es Teh Manis',
      sku: 'ETM-003',
      price: 6000,
      stock: 100,
      description: 'Es teh manis segar.',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['minuman'],
    },
    {
      name: 'Es Kopi Susu Gula Aren',
      sku: 'KSG-004',
      price: 18000,
      stock: 60,
      description: 'Espresso blend dengan susu segar dan sirup gula aren murni.',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['minuman', 'kopi'], // Many-to-many
    },
    {
      name: 'Caramel Macchiato',
      sku: 'CMA-005',
      price: 24000,
      stock: 30,
      description: 'Espresso dengan steamed milk dan caramel drizzle.',
      imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['minuman', 'kopi'], // Many-to-many
    },
    {
      name: 'Kentang Goreng Keju',
      sku: 'KFG-006',
      price: 15000,
      stock: 35,
      description: 'Kentang goreng renyah dengan taburan bumbu keju.',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['cemilan', 'makanan'], // Many-to-many
    },
    {
      name: 'Roti Bakar Cokelat Keju',
      sku: 'RBK-007',
      price: 16000,
      stock: 8, // Low stock to demonstrate stock alerts
      description: 'Roti bakar isi cokelat ditaburi keju parut melimpah.',
      imageUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      categorySlugs: ['cemilan'],
    },
  ];

  for (const prod of productsData) {
    const { categorySlugs, ...prodData } = prod;
    
    // Create product
    const createdProduct = await prisma.product.create({
      data: prodData,
    });

    // Create ProductCategory mappings
    for (const slug of categorySlugs) {
      const category = categories[slug];
      if (category) {
        await prisma.productCategory.create({
          data: {
            productId: createdProduct.id,
            categoryId: category.id,
          },
        });
      }
    }
  }

  console.log('Seeded products and linked categories successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
