# ThinkBoard

All-in-one business management platform built for small and medium businesses. Manage your CRM pipeline, point-of-sale, invoicing, inventory, accounting, notes, and tasks from a single dashboard.

## Live Demo

**URL:** _coming soon_

**Demo credentials:**
- Email: `demo@thinkboard.app`
- Password: `Demo@1234`

## Features

- **CRM** — Lead pipeline with Kanban board, stage tracking, and follow-up management
- **Point of Sale** — Billing screen, product catalog, customer lookup, and sales history
- **Invoicing** — Create, send, and track invoices with PDF export and VAT support
- **Inventory** — Product management with low-stock alerts, cost/selling price tracking, and SKU support
- **Accounting** — Income and expense tracking with category breakdown and payment method filters
- **Customers** — Customer directory with contact details and address management
- **Notes** — Rich text notes for meetings, planning, and documentation
- **Tasks** — Todo list with priority levels, categories, and completion tracking
- **Organizations** — Multi-tenant support with role-based access control (Owner, Admin, Manager, Member, Viewer)

## Tech Stack

**Frontend:** React 19, Vite 7, Tailwind CSS 4, DaisyUI, React Router 7, Axios, Recharts, Lucide Icons

**Backend:** Express 4, MongoDB with Mongoose 9, JWT (httpOnly cookies), Zod validation, PDFKit, Nodemailer

**Infrastructure:** Vercel (frontend), Render (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### Frontend

```bash
cd vite-project
cp .env.example .env   # set VITE_BACKEND_URL
npm install
npm run dev
```

### Seed Demo Data

```bash
cd backend
npm run seed
```

This creates a demo user with sample data across all modules.

## Project Structure

```
backend/
  src/
    core/           # Auth, models, middleware, config
    modules/        # Feature modules (crm, pos, invoices, inventory, etc.)
    scripts/        # Seed script
vite-project/
  src/
    Pages/          # Route-level page components
    components/     # Shared components (DashboardLayout, ErrorBoundary)
    features/       # Feature-specific components (POS)
    context/        # React context (auth, app state)
    config/         # Sidebar config, constants
```

## Author

**Aashish Sunar**

- [GitHub](https://github.com/aahishsunar)
- [LinkedIn](https://linkedin.com/in/aahishsunar)
