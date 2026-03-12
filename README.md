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

## Production Deployment (GitHub + Vercel)

This project is configured for split deployment on **Vercel** — the backend (serverless Node.js) and frontend (React static build) are deployed as two separate Vercel projects.

### 1. Push to GitHub

```bash
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/food-cost-control.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) → Import your repo.
2. Set **Root Directory** to `server`.
3. Add Environment Variables in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string (see step 4 below) |
| `JWT_SECRET` | A strong random string (32+ chars) |
| `JWT_EXPIRES_IN` | `24h` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://your-frontend.vercel.app` |

4. Deploy. Note the URL (e.g. `https://food-cost-api.vercel.app`).

### 3. Deploy Frontend (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) → Import the **same repo** again.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Create React App**.
4. Add Environment Variable:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://food-cost-api.vercel.app/api` |

5. Deploy. Update the backend's `CLIENT_URL` env var to match this frontend URL.

### 4. Neon Database Setup

1. Sign up at **[neon.tech](https://neon.tech)** (free tier — 0.5 GB storage, always-on compute).
2. Create a new project → name it `foodcontrol`.
3. Copy the **Connection string** from the dashboard. It looks like:
   ```
   postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/foodcontrol?sslmode=require
   ```
4. Paste it as the `DATABASE_URL` environment variable in both Vercel projects and your local `.env`.
5. Run migrations and seed against Neon:
   ```bash
   # Add DATABASE_URL to server/.env, then:
   cd server
   npm run migrate
   npm run seed
   ```

### 5. CI/CD

A GitHub Actions workflow is included at `.github/workflows/ci.yml`. It runs on every push and PR to `main`:
- **Server job**: Installs deps and verifies the server module loads without errors.
- **Client job**: Installs deps and runs `npm run build` to catch compile-time issues.

Vercel auto-deploys on every push to `main` once connected.

---

## License

MIT
