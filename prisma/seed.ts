/**
 * Seed script — populates the database with demo data for Maxbuy Ventures.
 * Run with: npm run db:seed
 */
import { PrismaClient, Role, CustomerType, PaymentMethod, ExpenseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Maxbuy Ventures database...');

  // Branch
  const mainBranch = await prisma.branch.create({
    data: { name: 'Maxbuy Ventures — Main Branch', isMain: true, address: 'Abuja, FCT', phone: '+234 800 000 0000' },
  });

  // Staff
  const adminPass = await bcrypt.hash('maxbuy2024', 10);
  const staffPass = await bcrypt.hash('staff123', 10);

  const admin = await prisma.staff.create({
    data: { name: 'Administrator', username: 'admin', passwordHash: adminPass, role: Role.SUPER_ADMIN, branchId: mainBranch.id },
  });

  await prisma.staff.createMany({
    data: [
      { name: 'Amara Obi', username: 'amara', passwordHash: staffPass, role: Role.CASHIER, phone: '+234 800 000 0002', branchId: mainBranch.id },
      { name: 'Kola Adebayo', username: 'kola', passwordHash: staffPass, role: Role.STOCK_KEEPER, phone: '+234 800 000 0003', branchId: mainBranch.id },
      { name: 'Ngozi Ibrahim', username: 'ngozi', passwordHash: staffPass, role: Role.SALES_REP, phone: '+234 800 000 0004', branchId: mainBranch.id, isActive: false },
    ],
  });

  // Categories
  const categoryNames = [
    { name: 'Groceries', emoji: '🌾' },
    { name: 'Beverages', emoji: '🥤' },
    { name: 'Baby Feeds', emoji: '👶' },
    { name: 'Toiletries', emoji: '🧴' },
    { name: 'Cartons', emoji: '📦' },
    { name: 'Household', emoji: '🏠' },
  ];
  const categories: Record<string, string> = {};
  for (const c of categoryNames) {
    const cat = await prisma.category.create({ data: c });
    categories[c.name] = cat.id;
  }

  // Suppliers
  const supplierA = await prisma.supplier.create({
    data: { name: 'Dabiri Foods Ltd', contactName: 'Mr. Dabiri', phone: '+234 811 000 1111', productsSupplied: 'Groceries, Cartons' },
  });
  const supplierB = await prisma.supplier.create({
    data: { name: 'ABC Beverages Dist.', contactName: 'Mrs. Chisom', phone: '+234 812 000 2222', productsSupplied: 'Beverages, Drinks', balanceOwed: 25000 },
  });
  const supplierC = await prisma.supplier.create({
    data: { name: 'Babycee Baby Products', contactName: 'Mr. James', phone: '+234 813 000 3333', productsSupplied: 'Baby Feeds, Diapers' },
  });
  const supplierD = await prisma.supplier.create({
    data: { name: 'Hygienic Supplies Co.', contactName: 'Oga Femi', phone: '+234 814 000 4444', productsSupplied: 'Toiletries, Household', balanceOwed: 8000 },
  });

  // Products
  const products = [
    { name: 'Nestle Milo 400g', category: 'Beverages', sellingPrice: 3200, costPrice: 2400, stockQuantity: 45, unit: 'Piece', lowStockAlert: 10, barcode: 'MIL400', supplierId: supplierB.id, expiryDate: new Date('2025-12-01') },
    { name: 'Indomie Noodles (Carton)', category: 'Cartons', sellingPrice: 8500, costPrice: 6200, stockQuantity: 28, unit: 'Carton', unitsPerCarton: 40, lowStockAlert: 5, barcode: 'IND001', supplierId: supplierA.id, expiryDate: new Date('2026-06-15') },
    { name: 'Pampers Baby Diapers S', category: 'Baby Feeds', sellingPrice: 6800, costPrice: 5100, stockQuantity: 15, unit: 'Pack', lowStockAlert: 5, barcode: 'PAM001', supplierId: supplierC.id, expiryDate: new Date('2027-01-01') },
    { name: 'Dangote Sugar 1kg', category: 'Groceries', sellingPrice: 1200, costPrice: 900, stockQuantity: 80, unit: 'Piece', lowStockAlert: 20, barcode: 'DAN001', supplierId: supplierA.id, expiryDate: new Date('2026-09-01') },
    { name: 'Peak Milk 400g', category: 'Beverages', sellingPrice: 2400, costPrice: 1800, stockQuantity: 32, unit: 'Piece', lowStockAlert: 10, barcode: 'PKM400', supplierId: supplierB.id, expiryDate: new Date('2025-08-20') },
    { name: 'SMA Baby Formula', category: 'Baby Feeds', sellingPrice: 12500, costPrice: 9500, stockQuantity: 8, unit: 'Tin', lowStockAlert: 5, barcode: 'SMA001', supplierId: supplierC.id, expiryDate: new Date('2026-04-01') },
    { name: 'Vaseline Petroleum Jelly', category: 'Toiletries', sellingPrice: 1800, costPrice: 1200, stockQuantity: 25, unit: 'Piece', lowStockAlert: 8, barcode: 'VAS001', supplierId: supplierD.id, expiryDate: new Date('2028-01-01') },
    { name: 'Semovita 2kg', category: 'Groceries', sellingPrice: 2800, costPrice: 2100, stockQuantity: 3, unit: 'Bag', lowStockAlert: 10, barcode: 'SEM002', supplierId: supplierA.id, expiryDate: new Date('2026-03-01') },
    { name: 'Sprite 50cl (Carton)', category: 'Beverages', sellingPrice: 7200, costPrice: 5400, stockQuantity: 0, unit: 'Carton', unitsPerCarton: 24, lowStockAlert: 3, barcode: 'SPR001', supplierId: supplierB.id, expiryDate: new Date('2025-11-01') },
    { name: 'Omo Detergent 2.5kg', category: 'Household', sellingPrice: 4200, costPrice: 3100, stockQuantity: 18, unit: 'Bag', lowStockAlert: 8, barcode: 'OMO001', supplierId: supplierD.id, expiryDate: new Date('2027-06-01') },
  ];

  const createdProducts: Record<string, string> = {};
  for (const p of products) {
    const { category, ...rest } = p;
    const created = await prisma.product.create({
      data: { ...rest, categoryId: categories[category], branchId: mainBranch.id },
    });
    createdProducts[p.name] = created.id;
  }

  // Customers
  const cust1 = await prisma.customer.create({ data: { name: 'Mrs. Amaka Okafor', phone: '+2348012345678', type: CustomerType.WHOLESALE, totalSpent: 450000, loyaltyPoints: 4500 } });
  const cust2 = await prisma.customer.create({ data: { name: 'Alhaji Musa Bello', phone: '+2348023456789', type: CustomerType.WHOLESALE, totalSpent: 280000, loyaltyPoints: 2800 } });
  const cust3 = await prisma.customer.create({ data: { name: 'Mrs. Grace Adeleke', phone: '+2348034567890', type: CustomerType.RETAIL, totalSpent: 95000, loyaltyPoints: 950 } });
  const cust4 = await prisma.customer.create({ data: { name: 'Mr. Chidi Eze', phone: '+2348045678901', type: CustomerType.RETAIL, totalSpent: 67000, loyaltyPoints: 670 } });
  const cust5 = await prisma.customer.create({ data: { name: 'Hajiya Fatima', phone: '+2348056789012', type: CustomerType.VIP, totalSpent: 620000, loyaltyPoints: 6200 } });
  const cust6 = await prisma.customer.create({ data: { name: 'Mr. Taiwo Adeyemi', phone: '+2348067890123', type: CustomerType.RETAIL, totalSpent: 42000, loyaltyPoints: 420 } });

  // Sample sale
  const sale1 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-0001',
      customerId: cust5.id,
      staffId: admin.id,
      branchId: mainBranch.id,
      subtotal: 95000,
      totalAmount: 95000,
      paymentMethod: PaymentMethod.TRANSFER,
      items: {
        create: [
          { productId: createdProducts['Nestle Milo 400g'], quantity: 5, unitPrice: 3200, lineTotal: 16000 },
          { productId: createdProducts['Peak Milk 400g'], quantity: 10, unitPrice: 2400, lineTotal: 24000 },
        ],
      },
    },
  });

  // Debts
  await prisma.debt.createMany({
    data: [
      { customerId: cust2.id, amount: 45000, dueDate: new Date('2026-04-30'), description: 'Wholesale goods' },
      { customerId: cust4.id, amount: 18500, dueDate: new Date('2026-05-05'), description: 'Grocery supplies' },
      { customerId: cust6.id, amount: 12000, dueDate: new Date('2026-05-20'), description: 'Toiletries' },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      { category: ExpenseCategory.ELECTRICITY, description: 'AEDC monthly bill', amount: 18000, recordedById: admin.id, branchId: mainBranch.id },
      { category: ExpenseCategory.TRANSPORT, description: 'Market delivery x3', amount: 4500, recordedById: admin.id, branchId: mainBranch.id },
      { category: ExpenseCategory.STAFF_SALARY, description: 'May salary advance', amount: 15000, recordedById: admin.id, branchId: mainBranch.id },
      { category: ExpenseCategory.RESTOCKING, description: 'Supplier payment', amount: 50000, recordedById: admin.id, branchId: mainBranch.id },
    ],
  });

  // Invoice counter — initialized to the highest seeded invoice number.
  await prisma.counter.upsert({
    where: { name: 'invoice' },
    create: { name: 'invoice', value: 1 },
    update: { value: 1 },
  });

  console.log('Seed complete. Sale created:', sale1.invoiceNumber);
  console.log('Login with admin / maxbuy2024');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
