# 🍽️ FoodControl Pro

**Full-Stack Food Cost Control Dashboard** for restaurants and hotel F&B operations.

Built with React + TailwindCSS + Chart.js (frontend) and Node.js + Express + PostgreSQL (backend).

---

## Features

### Core Modules
- **Dashboard** — KPI cards (Food Sales, Food Cost, Cost %, Inventory Value, Variance %), charts for trends, top items, consumption
- **Inventory Management** — Add/edit/delete items, purchases, stock issues, low stock alerts
- **Recipe Management** — Create recipes with ingredients, auto-calculate recipe cost and food cost %
- **POS Sales** — Record daily sales with automatic theoretical cost calculation
- **Food Cost Analysis** — Issue-based (Opening + Purchases - Closing) and Sales-based (Recipe Cost × Qty) methods
- **Variance Analysis** — Actual issue vs theoretical usage comparison with per-item breakdown
- **Reports** — Daily food cost, inventory, purchase, waste, and menu profitability reports
- **Waste Tracking** — Record food waste with reasons, auto-deduct from stock
- **Menu Engineering** — Star / Plow Horse / Puzzle / Dog classification matrix
- **Supplier Management** — CRUD for supplier contacts

### Extra Features
- JWT authentication with role-based access (Admin, F&B Controller, Store Manager)
- CSV export on all major reports
- Low stock notification alerts on dashboard
- Responsive mobile design with collapsible sidebar
- Seed data for a demo restaurant (20 inventory items, 10 recipes, 30 days of sales)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TailwindCSS, Chart.js, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| API | REST |

---

## Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+ running locally
- **npm** or **yarn**

### 1. Setup Database

```sql
CREATE DATABASE foodcontrol;
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Run Migrations & Seed Data

```bash
cd server
npm run migrate
npm run seed
```

### 5. Start Development

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 3000)
cd client
npm start
```

Open **http://localhost:3000** in your browser.

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| F&B Controller | controller | admin123 |
| Store Manager | store_mgr | admin123 |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register (admin only) |
| GET | /api/dashboard | Dashboard KPIs & charts |
| GET/POST | /api/inventory | Inventory CRUD |
| POST | /api/inventory/purchase | Record purchase |
| POST | /api/inventory/issue | Issue stock to kitchen |
| GET/POST | /api/recipes | Recipe CRUD |
| GET/POST | /api/sales | Sales CRUD |
| GET | /api/foodcost/issue-based | Issue-based food cost |
| GET | /api/foodcost/sales-based | Sales-based food cost |
| GET | /api/variance | Variance analysis |
| GET | /api/reports/* | Various reports |
| GET/POST | /api/waste | Waste tracking |
| GET | /api/menu-engineering | Menu engineering matrix |
| GET/POST | /api/suppliers | Supplier CRUD |

---

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # Express routes
│   │   ├── seeds/           # Migration & seed scripts
│   │   └── index.js         # Entry point
│   ├── .env
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── utils/           # Helpers & formatters
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## Database Schema

**Tables:** Users, Suppliers, InventoryItems, StockTransactions, Purchases, Recipes, RecipeIngredients, Sales, StockIssues, WasteLogs

---

## License

MIT
