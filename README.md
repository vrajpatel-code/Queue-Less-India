<div align="center">
  <img src="https://img.icons8.com/?size=512&id=113032&format=png" alt="QueueLess Logo" width="120" />

  <h1>🚀 QueueLess India 🇮🇳</h1>
  
  <p><strong>Smart Real-Time Queue Management for Government Offices (RTO, Mamlatdar, Civic Centers)</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react" alt="React 18" />
    <img src="https://img.shields.io/badge/Vite-B73BFE.svg?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  </p>
</div>

---

## ✨ Features & Specifications

Wait in line virtually! **QueueLess** modernizes government and civic center experiences by replacing physical queues with digital, trackable, smart tokens.

### 👥 User Roles & Flows

| Role | Access URL | Core Capabilities |
| :--- | :--- | :--- |
| **👩🏽‍💻 Citizen** | `/citizen` | Book a smart token for a specific service. Track live queue position & wait time. Receive real-time push/socket updates when their turn approaches. |
| **👨🏽‍💼 Worker** | `/worker` | View the assigned service queue. Call the next token, mark tokens as done, or skip absent citizens. Fully synced with citizen screens. |
| **👑 Admin** | `/admin` | Manage departments and available services. Assign workers to counters. Monitor comprehensive analytics, queue history, and performance charts. |

---

## 🛠️ Project Structure

```text
src/
├── components/           # Reusable UI (Cards, Tables, Modals, Spinners)
├── pages/                # Main Application Views (Login, Dashboards)
├── services/             # Core Integrations (Axios API, Socket.IO, Supabase)
├── layouts/              # Structural wrappers (Navbar + Sidebar)
├── App.jsx               # Router Configuration & Auth Context
└── main.jsx              # App Entry Point & Providers
```

---

## 🚀 Quick Start & Setup

Follow these steps to run QueueLess locally. Ensure you have Node.js and npm installed.

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/queueless.git
cd queueless

# Install dependencies
npm install
```

### 2️⃣ Environment Configuration
Create a `.env` file from the example template and update it with your backend/Supabase credentials.
```bash
cp .env.example .env
```

**Required Environment Variables:**
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend Express API base URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO WebSockets Server | `http://localhost:5000` |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhb...` |

### 3️⃣ Database Schema Setup
We use Supabase for the database layer. 
1. Open your Supabase Project SQL Editor.
2. We have combined all required structures into a single file! Navigate to `supabase/schema.sql` within this repository and run the entire script to build tables, configure RLS, set up Realtime triggers, and seed initial services.

### 4️⃣ Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 📡 API Endpoints Expected (Backend Context)

> **Note**: This repository represents the Frontend React App. It expects a backend matching these distinct endpoints based on Express.js and Socket.IO.

* **Auth**: `POST /api/auth/login`, `GET /api/auth/me`
* **Queueing**: `POST /api/queue/token`, `GET /api/queue/status/:token_id`, `POST /api/queue/next`, `PUT /api/queue/:id/done`, `PUT /api/queue/:id/skip`
* **Departments**: `GET /api/departments`, `POST /api/departments`, `POST /api/departments/:id/assign-worker`
* **Analytics**: `GET /api/analytics/summary`, `GET /api/analytics/daily`

### ⚡ Socket.IO Events
* `join_dept` `{ department_id }` / `leave_dept` `{ department_id }` -> Join/leave specific department rooms to receive localized updates.
* `queue_updated` / `token_called` -> Server emits these to trigger real-time UI refreshes.

---

<div align="center">
  <p>Built with ❤️ to streamline public services in India.</p>
</div>
