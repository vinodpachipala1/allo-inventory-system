# 📦 Allo Inventory System

A modern, high-performance inventory and reservation management system built with Next.js. This application allows users to browse products, check real-time stock across multiple warehouse hubs, and securely lock in reservations before purchasing.

## ✨ Features

* **Multi-Warehouse Tracking:** View available stock for individual products distributed across different geographic hubs.
* **Atomic Reservations:** Uses Prisma transactions and optimistic locking to prevent double-booking. When an item is reserved, stock is instantly deducted.
* **Time-Locked Carts:** Reservations are held for 10 minutes. If the user doesn't check out, the items are returned to the pool.
* **Idempotent API:** Safe checkout routes prevent duplicate charges or reservations if a user accidentally double-clicks or experiences network drops.
* **Manual Cron Triggers:** Bypass platform cron limitations with a built-in admin UI to manually release expired reservations.
* **Responsive Dashboard:** A beautiful, responsive UI built with Tailwind CSS and shadcn/ui, featuring custom animations and an emerald color theme.
* **Hub Analytics:** View aggregated inventory data grouped by warehouse location.

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Database:** PostgreSQL
* **ORM:** [Prisma](https://www.prisma.io/)
* **Styling:** Tailwind CSS
* **Components:** [shadcn/ui](https://ui.shadcn.com/)
* **Icons:** Lucide React
* **Notifications:** Sonner (Success/failure popup toasts at the top)

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository
\`\`\`bash
git clone <your-repo-url>
cd allo-inventory-system
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your PostgreSQL database connection string:
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/allo_inventory?schema=public"
\`\`\`

### 4. Setup the Database
Generate the Prisma Client and push the schema to your database:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### 5. Start the Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

* `/app/page.tsx` - Main product grid and entry point (Server Component).
* `/app/ProductGrid.tsx` - Client-side interactive product cards with quantity selectors.
* `/app/warehouses/page.tsx` - Inventory view grouped by warehouse location.
* `/app/reservations/page.tsx` - Global ledger of all active, released, and confirmed reservations.
* `/app/checkout/page.tsx` - The time-locked checkout flow.
* `/app/api/reservations/route.ts` - Core atomic reservation logic and idempotency checks.
* `/app/api/cron/cleanup/route.ts` - Logic to release expired 10-minute holds.

## Live Demo
You can view the live application here: **[https://allo-inventory-system-41ro.vercel.app/]**