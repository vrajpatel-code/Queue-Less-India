# QueueLess India 🇮🇳

Smart Real-Time Queue Management for Government Offices (RTO, Mamlatdar, Civic Centers)

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Utility-first styling
- **React Router DOM v6** — Client-side routing
- **Axios** — HTTP client with interceptors
- **Socket.IO Client** — Real-time queue updates
- **Recharts** — Analytics charts

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your backend URL

# 3. Start development server
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Top navigation with user menu
│   ├── Sidebar.jsx         # Role-based sidebar navigation
│   ├── ProtectedRoute.jsx  # JWT-protected route wrapper
│   ├── TokenCard.jsx       # Live token display with status
│   ├── QueueTable.jsx      # Reusable queue list table
│   ├── StatsCard.jsx       # Analytics stat card
│   └── LoadingSpinner.jsx  # Loading state component
├── pages/
│   ├── Login.jsx           # Authentication page
│   ├── CitizenDashboard.jsx  # Token booking & tracking
│   ├── WorkerDashboard.jsx   # Queue serving interface
│   └── AdminDashboard.jsx    # Analytics & management
├── services/
│   ├── api.js              # Axios API service layer
│   └── socket.js           # Socket.IO connection manager
├── layouts/
│   └── DashboardLayout.jsx # Sidebar + Navbar wrapper
├── App.jsx                 # Router + Auth context
├── main.jsx               # Entry point
└── index.css              # Global Tailwind styles
```

## User Roles & Routes

| Role     | Route      | Features |
|----------|------------|---------|
| Citizen  | `/citizen` | Take token, track position, live updates |
| Worker   | `/worker`  | Serve queue, call next, mark done/skip |
| Admin    | `/admin`   | Departments, worker assignment, analytics |

## API Endpoints Expected

### Auth
- `POST /api/auth/login` — Login with email/password
- `GET /api/auth/me` — Get current user

### Queue
- `POST /api/queue/token` — Issue new token
- `GET /api/queue/status/:token_id` — Token status & position
- `POST /api/queue/next` — Call next token
- `PUT /api/queue/:id/done` — Mark token done
- `PUT /api/queue/:id/skip` — Skip token
- `GET /api/queue?department_id=` — Get department queue

### Departments
- `GET /api/departments` — List all departments
- `POST /api/departments` — Create department
- `POST /api/departments/:id/assign-worker` — Assign worker

### Analytics
- `GET /api/analytics/summary` — Today's summary stats
- `GET /api/analytics/daily` — Last 7 days chart data

## Socket Events

### Client → Server
- `join_dept` `{ department_id }` — Join department room
- `leave_dept` `{ department_id }` — Leave department room

### Server → Client
- `queue_updated` — Queue state changed
- `token_called` — Specific token called

## Build for Production

```bash
npm run build
# Output in /dist folder
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |
