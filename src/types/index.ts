export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER' | 'STOCK_KEEPER' | 'SALES_REP';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'POS' | 'CREDIT';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'VIP';
export type ExpenseCategory = 'RENT' | 'ELECTRICITY' | 'TRANSPORT' | 'STAFF_SALARY' | 'RESTOCKING' | 'REPAIRS' | 'OTHER';

export interface Category {
  id: string;
  name: string;
  emoji?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  productsSupplied?: string | null;
  balanceOwed: number;
  lastOrderAt?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  category?: Category;
  supplierId?: string | null;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  unitsPerCarton?: number | null;
  stockQuantity: number;
  lowStockAlert: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  type: CustomerType;
  loyaltyPoints: number;
  totalSpent: number;
}

export interface SaleItem {
  id?: string;
  productId: string;
  name?: string;
  emoji?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName?: string;
  staffId: string;
  staffName?: string;
  subtotal: number;
  discountPct: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isRefunded: boolean;
  createdAt: string;
  items: SaleItem[];
}

export interface Debt {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  amountPaid: number;
  description?: string | null;
  dueDate?: string | null;
  isSettled: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description?: string | null;
  amount: number;
  recordedById: string;
  recordedByName?: string;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  lastActiveAt?: string | null;
}

export interface CartItem {
  productId: string;
  name: string;
  emoji: string;
  price: number;
  quantity: number;
  stockQuantity: number;
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  totalStockValue: number;
  totalProducts: number;
  outstandingDebts: number;
  debtorsCount: number;
  revenueChangePct: number;
}
