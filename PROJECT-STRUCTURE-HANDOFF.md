# 👑 MiniRoyal Store — Project Structure & Master Handoff Document
**Official Domain:** `https://miniroyal.shop`  
**GitHub Repository:** `https://github.com/ehsansalehi63/miniroyal`  
**Git Working Branch:** `arena/01a04d03-miniroyal` (Synchronized with `main`)  
**Deployment Platform:** Hostinger Node.js Application Manager  
**Auto-Deploy Webhook Endpoint:** `https://miniroyal.shop/api/github-webhook`  
**System Health Diagnostic Endpoint:** `https://miniroyal.shop/api/system-health`  

---

## 📐 Project Architecture & Tech Stack

- **Framework:** Next.js 16.3.3 (App Router with `output: "standalone"` & `images.unoptimized: true`)
- **Language:** TypeScript 5.x (Strict mode)
- **Styling & Design System:** Tailwind CSS v4, Lucide React icons, Persian RTL (`dir="rtl"`, `lang="fa"`)
- **Typography:** Vazirmatn local fonts (`Vazirmatn-Regular.ttf`, `Vazirmatn-Bold.ttf`, `Vazirmatn-Black.ttf`)
- **State Management:** Zustand with `persist` middleware for shopping cart (`app/lib/cart.ts`)
- **Database Layer:** MySQL connection pool (`mysql2`) wrapper in `app/lib/mysql.ts` with Graceful Degradation to Mock Catalog
- **Server Entry Point:** `server.js` wrapping Next.js production server for Hostinger
- **Deployment Config:** `hostinger.json` & `.github/workflows/deploy.yml`

---

## 🗺️ Application Route Structure & Features

| Route Path | Description & Features |
|---|---|
| `/` | Main storefront home page with hero banner, category grid, featured products, and value props |
| `/shop` | Full catalog page with search, sorting, and pagination |
| `/category/[...slug]` | Dynamic category routes (`/category/pesaraneh`, `/category/dokhtaraneh`, `/category/nozad`, `/category/set`, `/category/madreseh`, `/category/majlesi`) |
| `/product/[slug]` | Product detail page with image gallery, size × color variant matrix, stock calculator, Smart Size Fit calculator, centimeter size chart, customer reviews with `size_fit` rating, product FAQs, related products, and JSON-LD |
| `/virtual-tryon` | Interactive 2D Virtual Try-On & Smart Fit size calculator (height, weight, age sliders + growth buffer + % confidence score) |
| `/cart` | Interactive Zustand shopping cart with item quantity controls, coupon code validation (`MINI10`, `ROYAL50`, `WELCOME`), and free shipping progress bar |
| `/checkout` | 3-Step checkout form for recipient address, shipping method (Post / Tipax), and gateway choice (Zarinpal / COD) |
| `/payment/verify` | Simulated Zarinpal Sandbox verification page |
| `/order/success/[orderNumber]` | Printable order confirmation invoice and status timeline |
| `/order/track` | Public order tracking portal by order number or mobile phone |
| `/search` | Live search results page with `noindex` tag |
| `/blog` & `/blog/[slug]` | Educational AI blog listing and detail pages with Article JSON-LD |
| `/about`, `/contact`, `/terms`, `/privacy`, `/returns`, `/faq` | Legal and support pages fulfilling Enamad criteria |
| `/admin` | Admin dashboard with KPI analytics, low stock warning table, and revenue summary |
| `/admin/health` | **System Health & Diagnostics Center** — 1-click test of all 8 core subsystems |
| `/admin/products` | Catalog product manager (Add, Edit title, price, variants, SKU, status) |
| `/admin/orders` | Order manager & courier status updater |
| `/admin/customers` | Customer directory & B2B/VIP loyalty manager |
| `/admin/coupons` | Discount coupon creator and manager |
| `/admin/reviews` | Review moderator & size fit feedback monitor |
| `/admin/categories` | Category & brand tree editor |
| `/admin/blog` | AI Blog content generator & publisher |
| `/admin/automation` | Automated ingestion pipeline monitor |
| `/admin/settings` | Store settings, Admin password change, SMS OTP gateway, Payment gateways, and Webhook status |

---

## 🗄️ Database Schema & SQL Scripts

- **DDL Master Script:** `docs/schema.sql` (29 MySQL tables across 9 domain groups, 100% phpMyAdmin / Shared Hosting compatible)
- **Migrations:** `migrations/001_initial.sql`
- **Database Init Script:** `scripts/init-db.sh`

### Table Summary:
1. `users` — Customer accounts & Admin credentials
2. `categories` — Hierarchy categories
3. `brands` — Brand directory
4. `products` — Base product catalog
5. `product_variants` — SKU size × color matrix
6. `product_images` — Image gallery
7. `size_guides` — Size chart measurements (cm)
8. `orders` — Orders header
9. `order_items` — Line items
10. `coupons` — Discount campaigns
11. `reviews` — Customer reviews & size fit ratings
12. `blog_posts` — Educational AI articles
13. `site_settings` — Key-value store config
... (29 tables total)

---

## 🔑 Default Credentials & Access Info

- **Admin Login Route:** `/admin`
- **Default Username:** `admin` (or `admin@miniroyal.shop` or `09123456789`)
- **Default Password:** `admin123` (Can be changed online at `/admin/settings`)
- **Hostinger SSH Credentials:**
  - IP: `82.198.227.172`
  - Port: `65002`
  - Username: `u699154314`
  - Target Dir: `domains/miniroyal.shop/public_html`

---

## 🚀 Deployment & Webhook Instructions

### Automatic Deployment via Webhook:
1. Every `git push` to `main` or `arena/01a04d03-miniroyal` triggers `https://miniroyal.shop/api/github-webhook`.
2. The endpoint automatically runs background `git pull && npm run build && pm2 restart miniroyal`.

### Live Verification:
Visit `https://miniroyal.shop/api/system-status` or navigate to `/admin/health` to confirm build date, system status, and live feature status.
