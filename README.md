# 🍔 Foodi++ — Full-Stack Cloud Food Delivery & Restaurant Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://foodi-olive.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://foodi-4ca0.onrender.com)
[![Cloud Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev)
[![Django](https://img.shields.io/badge/Backend-Django%204.2%20REST%20Framework-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com)
[![WebSockets](https://img.shields.io/badge/Real--Time-Django%20Channels%20%26%20Daphne-000000?style=for-the-badge&logo=websocket)](https://channels.readthedocs.io)

**Foodi++** is a production-ready, full-stack food delivery and multi-vendor restaurant management ecosystem built for modern web performance. It features real-time live GPS driver order tracking via WebSockets, dynamic 5-star customer ratings and reviews, instant downloadable PDF invoices, and tailored role-based workflows for **Customers**, **Restaurant Owners**, **Delivery Riders**, and **Platform Admins**.

---

## 🌐 Live Deployment Links

- 🚀 **Live Web Application (Frontend)**: [https://foodi-olive.vercel.app](https://foodi-olive.vercel.app)
- 🔌 **Cloud API & ASGI Server (Backend)**: [https://foodi-4ca0.onrender.com](https://foodi-4ca0.onrender.com)
- 💾 **Managed Cloud Database**: [Neon Serverless PostgreSQL](https://neon.tech) (AWS Singapore)

---

## 🔑 Demo Accounts & Showcase Credentials

Recruiters and visitors can log in with any of the pre-configured role-based test accounts below to explore the distinct portals:

| Role | Username | Password | Dashboard Features & Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **System Admin** | `admin` | `AdminPassword123!` | Review & approve/suspend restaurants, moderate users, configure promotional banners, system analytics. |
| 🍳 **Restaurant Owner** | `restaurant_owner` | `OwnerPassword123!` | Manage food menu, categories, pricing, calories, discount offers, accept incoming orders, live kitchen status. |
| 🛵 **Delivery Rider** | `delivery_rider` | `RiderPassword123!` | View active pickup requests, accept deliveries, update live delivery status, GPS location simulator. |
| 🛍️ **Customer** | `customer_demo` | `CustomerPassword123!` | Explore restaurants & menus, custom cart, checkout, live Leaflet map GPS tracking, 1–5 star ratings, PDF invoice download. |

> **Self-Registration**: You can also register your own brand new customer, restaurant owner, or rider account directly from the [Sign Up page](https://foodi-olive.vercel.app).

---

## ✨ Key Platform Features

### 1. 🛵 Real-Time Live Order Tracking (WebSockets)
- Powered by **Django Channels** and **Daphne ASGI** running asynchronous WebSocket channels (`/ws/orders/track/<id>/`).
- **Interactive Leaflet Map**: Displays the customer's delivery destination, the restaurant kitchen, and real-time moving delivery driver coordinates with custom animated map markers.
- Live order status step indicator (*Pending* ➔ *Preparing* ➔ *Ready* ➔ *Out for Delivery* ➔ *Delivered*).
- Built-in live delivery route simulator with real-time speed controls (`1x`, `2x`, `4x`) and step replays.

### 2. ⭐ Customer Rating & Review System
- Interactive 5-star rating modal with hover animations and mood descriptors (*Exceptional 🔥*, *Great 👍*, *Good 🙂*, *Fair 😐*, *Needs Improvement 👎*).
- Verified diner badge guarantee: only authenticated diners with confirmed delivered orders can submit feedback.
- Automatic backend recalculation of restaurant average rating (rounded to 1 decimal place) and review count.
- Restaurant cards display dynamic rating badges and allow customer filtering (*Above 4.5 Stars*, *Above 4.0 Stars*).
- Dedicated **[ Customer Reviews ]** tab on public restaurant pages displaying verified community feedback.

### 3. 📄 Client-Side PDF Invoice Generation
- Generates official, branded Foodi++ PDF receipts in the browser using `jspdf` and `jspdf-autotable`.
- Itemized invoice includes order ID, date, customer address, payment status, restaurant information, item breakdown with prices/quantities, delivery fees, and total paid.

### 4. 🏢 Multi-Tenant Restaurant Owner Hub
- Restaurant profile customizer (cuisine type, operational hours, delivery charges, banner/logo media).
- Real-time order dispatch board: accept, reject, mark preparing, and notify delivery riders.
- Menu management: categorize dishes, set calories, apply discounts and time-limited promotional deals.

### 5. 🛡️ Administrative Command Center
- Restaurant verification workflow: approve, reject with reason, or suspend restaurants.
- User management: inspect accounts, restrict abusive users, and view platform health metrics.
- Global announcement banner customization rendered dynamically across customer dashboards.

---

## 🛠️ Architecture & Technology Stack

```
                     ┌────────────────────────────────────────┐
                     │          Vercel Cloud (CDN)            │
                     │  React 19 + Vite Frontend Application  │
                     └───────────────────┬────────────────────┘
                                         │
                   HTTPS API Calls       │      WSS WebSockets
                   (REST Endpoints)      │      (Live Map Tracking)
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          Render Cloud Host             │
                     │  Django 4.2 REST Framework + Channels  │
                     │            Daphne ASGI Server          │
                     └───────────────────┬────────────────────┘
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          Neon Serverless Cloud         │
                     │          PostgreSQL Database           │
                     └────────────────────────────────────────┘
```

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM 7 (with SPA rewrite configuration)
- **Mapping & Geolocation**: Leaflet & React-Leaflet
- **UI & Styling**: Modern Glassmorphic CSS System (Inter Typography, Warm Amber & Slate palette)
- **Notifications & Charts**: Sonner, Recharts
- **Document Generation**: jsPDF & jsPDF-AutoTable

### Backend
- **Framework**: Django 4.2 & Django REST Framework
- **Asynchronous Protocol**: Django Channels 4 & Daphne ASGI
- **Authentication**: JWT (JSON Web Tokens) with `djangorestframework-simplejwt`
- **Database ORM**: `dj-database-url` (supporting Neon PostgreSQL in production & MySQL/SQLite in development)
- **Static Assets**: WhiteNoise 6 with compressed manifest storage

---

## 💻 Local Development Setup

To run Foodi++ locally on your personal machine:

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- XAMPP / MySQL or PostgreSQL (optional, SQLite works out of the box)

### 1. Clone the Repository
```bash
git clone https://github.com/s7hahe4/foodi-.git
cd foodi-
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed showcase demo data (admin, owner, rider, customer)
python manage.py seed_demo_data

# Start Daphne ASGI development server
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```
Backend API will be accessible at: `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd foodi-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 📡 Core API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/login/` | Obtain JWT access and refresh token pair | Public |
| `POST` | `/api/users/register/` | Register new customer, owner, or rider | Public |
| `GET` | `/api/restaurants/feed/` | List verified active restaurants with ratings | Public |
| `GET` | `/api/restaurants/<id>/reviews/` | Retrieve customer reviews for a restaurant | Public |
| `POST` | `/api/restaurants/<id>/reviews/` | Submit 1–5 star rating on a delivered order | Customer |
| `GET` | `/api/menu/public/<id>/` | Fetch public restaurant menu and active deals | Public |
| `POST` | `/api/menu/orders/` | Place a new customer order | Customer |
| `GET` | `/api/menu/orders/my-orders/` | List order history and live deliveries | Customer |
| `GET` | `/api/seed-demo/` | Trigger idempotent showcase demo data population | Admin / Dev |
| `WS` | `/ws/orders/track/<id>/` | Real-time WebSocket delivery updates | Authenticated |

---

## 👨‍💻 Author & Contact

Developed by **Shahedul Islam**  
- **GitHub**: [@s7hahe4](https://github.com/s7hahe4)  
- **LinkedIn**: [Shahedul Islam](https://www.linkedin.com/in/shahedul-islam-shahed-64b111270)  
- **Live Demo**: [https://foodi-olive.vercel.app](https://foodi-olive.vercel.app)

*Licensed under the MIT License.*
