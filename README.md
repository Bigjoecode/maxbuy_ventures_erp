# Maxbuy Ventures — Business Management System (ERP)

A production-ready, full-stack ERP system built for **Maxbuy Ventures**, a grocery and wholesale business. Built with **Next.js 14 App Router**, **Prisma ORM**, **PostgreSQL**, **Zustand**, and **Tailwind CSS**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, CSS Variables (dark/light mode) |
| **State** | Zustand (cart + auth + UI) |
| **Charts** | Recharts |
| **Backend** | Next.js API Routes (REST) |
| **Database** | PostgreSQL via Prisma ORM |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Validation** | Zod |
| **AI** | Anthropic Claude API (claude-sonnet-4-6) |
| **Receipts** | Browser print (print-to-PDF) + WhatsApp share |
| **Offline** | PWA service worker + IndexedDB (Dexie) |
| **Notifications** | react-hot-toast |

---

## 📁 Project Structure

```
maxbuy-ventures-erp/
├── prisma/
│   ├── schema.prisma          # Full database schema (14 models)
│   └── seed.ts                # Sample Maxbuy data seeder
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated route group (auth-guarded layout)
│   │   │   ├── layout.tsx     # Shared layout: sidebar + auth guard
│   │   │   ├── dashboard/     # KPI dashboard with charts
│   │   │   ├── pos/           # Point of Sale with cart + receipt
│   │   │   ├── inventory/     # Products, stock, categories
│   │   │   ├── suppliers/     # Supplier management
│   │   │   ├── expiry/        # Expiry date tracker
│   │   │   ├── sales/         # Sales history + invoices
│   │   │   ├── expenses/      # Expense tracking
│   │   │   ├── debts/         # Customer debt management
│   │   │   ├── customers/     # Customer CRM
│   │   │   ├── loyalty/       # Loyalty/rewards program
│   │   │   ├── staff/         # Staff accounts + roles
│   │   │   ├── reports/       # Analytics + reports
│   │   │   ├── ai-assistant/  # AI business chat (Claude API)
│   │   │   └── settings/      # System settings
│   │   │
│   │   ├── login/             # Public login page
│   │   │
│   │   └── api/               # REST API routes
│   │       ├── auth/login/    # POST — JWT login
│   │       ├── dashboard/     # GET — aggregated KPIs
│   │       ├── products/      # GET, POST, PATCH, DELETE
│   │       ├── categories/    # GET, POST
│   │       ├── sales/         # GET, POST (auto-deducts stock)
│   │       ├── customers/     # GET, POST, PATCH, DELETE
│   │       ├── debts/         # GET, POST, PATCH (payments)
│   │       ├── expenses/      # GET, POST
│   │       ├── suppliers/     # GET, POST
│   │       ├── staff/         # GET, POST
│   │       ├── reports/       # GET — full analytics
│   │       └── ai/chat/       # POST — Claude AI proxy
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Navigation sidebar with role badges
│   │   │   └── Topbar.tsx     # Top bar with search + dark mode
│   │   ├── ui/
│   │   │   ├── index.tsx      # Button, Badge, Modal, Input, Select, FormGroup
│   │   │   ├── Card.tsx       # Card + CardTitle
│   │   │   └── StatCard.tsx   # KPI metric card
│   │   ├── pos/
│   │   │   └── ReceiptModal.tsx  # Print + WhatsApp receipt
│   │   └── inventory/
│   │       └── ProductFormModal.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT sign/verify, bcrypt, permissions
│   │   ├── apiAuth.ts         # requireAuth() middleware helper
│   │   ├── apiClient.ts       # Authenticated fetch wrapper
│   │   └── utils.ts           # formatCurrency, formatDate, stock/expiry status
│   │
│   ├── store/
│   │   ├── authStore.ts       # Auth + UI state (Zustand, persisted)
│   │   └── cartStore.ts       # POS cart state (Zustand)
│   │
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces
│
├── .env.example               # Environment variable template
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/maxbuy_erp?schema=public"

# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-very-long-random-secret"

# Optional: for AI Assistant
ANTHROPIC_API_KEY="sk-ant-..."
```

> **Local development without PostgreSQL?**
> Change `provider = "postgresql"` to `provider = "sqlite"` in `prisma/schema.prisma` and set `DATABASE_URL="file:./dev.db"`.

### 3. Push schema to database

```bash
npx prisma db push
```

### 4. Seed with demo data

```bash
npm run db:seed
```

This creates:
- Admin account: `admin` / `maxbuy2024`
- Staff accounts: `amara`, `kola`, `ngozi` — password `staff123`
- 6 product categories, 4 suppliers, 10 products, 6 customers, sample sales, debts, and expenses

### 5. Start development server

```bash
npm run dev
```

Visit **http://localhost:3000** → redirects to login.

---

## 🔐 Authentication & Roles

JWT-based authentication. Token stored in `localStorage` via Zustand persist.

| Role | Permissions |
|---|---|
| `SUPER_ADMIN` | Full access to everything |
| `MANAGER` | POS, inventory, sales, expenses, debts, customers, reports, suppliers |
| `CASHIER` | POS, sales, customers only |
| `STOCK_KEEPER` | Inventory, suppliers, expiry tracker |
| `SALES_REP` | POS, customers, debts |

Permission checking is enforced server-side via `requireAuth(req, 'permission-key')` in every API route.

---

## ⚡ Core Automations

| Automation | Where it happens |
|---|---|
| **Auto stock deduction** | `POST /api/sales` — inside a DB transaction |
| **Loyalty points accrual** | `POST /api/sales` — ₦1,000 spent = 10 pts |
| **Invoice number generation** | `POST /api/sales` — sequential `INV-XXXX` |
| **Low stock detection** | `GET /api/dashboard` + inventory page |
| **Expiry alerts** | `GET /api/products` with expiry date filtering |
| **Debt creation from sale** | `POST /api/sales` with `isCreditSale: true` |
| **Stock movement log** | Every stock change records to `StockMovement` |
| **Activity audit log** | Every login, sale, product change logged to `ActivityLog` |

---

## 📊 Key API Endpoints

```
POST   /api/auth/login              Login, returns JWT
GET    /api/dashboard               KPIs, alerts, weekly chart
GET    /api/products                List (search, category, status filters)
POST   /api/products                Create product
PATCH  /api/products/:id            Update product / adjust stock
DELETE /api/products/:id            Soft delete
GET    /api/sales?period=today      Sales list
POST   /api/sales                   Checkout (deducts stock, logs activity)
GET    /api/customers               Customer list
POST   /api/customers               Add customer
GET    /api/debts                   Outstanding debts
POST   /api/debts                   Record debt
PATCH  /api/debts/:id               Record payment
GET    /api/expenses                Expense list
POST   /api/expenses                Record expense
GET    /api/reports?period=month    Full analytics payload
GET    /api/suppliers               Supplier list
POST   /api/suppliers               Add supplier
GET    /api/staff                   Staff list (admin only)
POST   /api/staff                   Add staff account
POST   /api/ai/chat                 AI assistant (Claude API)
```

All protected routes require `Authorization: Bearer <token>` header.

---

## 🗄️ Database Models

| Model | Purpose |
|---|---|
| `Branch` | Multi-branch support |
| `Staff` | User accounts with roles |
| `Category` | Product categories |
| `Supplier` | Supplier management |
| `Product` | Products with stock, expiry, pricing |
| `StockMovement` | Full stock movement audit trail |
| `Customer` | Customer CRM with loyalty |
| `Sale` | Sales transactions |
| `SaleItem` | Line items within a sale |
| `Debt` | Customer credit/debt tracking |
| `Expense` | Business expense records |
| `PurchaseOrder` | Purchase order management |
| `PurchaseOrderItem` | PO line items |
| `ActivityLog` | Staff activity audit log |

---

## 🧩 Extending the System

### Add a new API route
```ts
// src/app/api/my-feature/route.ts
import { requireAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'my-permission');
  if (auth instanceof NextResponse) return auth;
  // your logic here
}
```

### Add a new page
```
src/app/(dashboard)/my-page/page.tsx
```
Add a link in `src/components/layout/Sidebar.tsx`.

### Add a new DB model
Edit `prisma/schema.prisma`, then run:
```bash
npx prisma db push
```

---

## 🌐 Production Deployment

### Recommended: Vercel + Supabase (PostgreSQL)

1. Push code to GitHub
2. Create a Supabase project → copy the connection string
3. Deploy to Vercel → add environment variables
4. Run `npx prisma db push` from Vercel build command or locally against prod DB
5. Run `npm run db:seed` once against prod DB

### Self-hosted: Ubuntu + PM2

```bash
npm run build
pm2 start npm --name "maxbuy-erp" -- start
```

### Environment for production

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="<long-random-string>"
ANTHROPIC_API_KEY="sk-ant-..."
NODE_ENV="production"
```

---

## 📱 Mobile / PWA

The app is fully responsive. To install as a PWA on Android:
1. Open in Chrome Mobile → Menu → "Add to Home Screen"
2. For a proper APK: use [PWABuilder](https://www.pwabuilder.com/) with the deployed URL

---

## 📞 Support

Built for **Esther Archibong Umoinyang** — Maxbuy Ventures, Port Harcourt.

Developed by Claude (Anthropic). Extend, modify, and own this codebase freely.
