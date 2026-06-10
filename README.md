# Course Management System

A full-stack web application for managing university courses, students, professors, assignments and grades.

**Stack:** Microsoft Stack — ASP.NET Core 8 · React 18 + Vite · MSSQL · MongoDB

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 8.0+ |
| Node.js | 18+ |
| SQL Server | 2019+ (or Express edition) |
| MongoDB | 6.0+ |

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd Course-Management
```

---

## 2. Backend setup

### 2.1 Configure local secrets

Copy the example and fill in your values — this file is gitignored and never committed:

```bash
cp backend/WebAPI/appsettings.json backend/WebAPI/appsettings.Local.json
```

Edit `backend/WebAPI/appsettings.Local.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=CourseManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Secret": "YourStrongSecretKeyAtLeast32Characters!"
  }
}
```

> **Important:** The `JwtSettings.Secret` must be at least 32 characters long.

### 2.2 Start MongoDB

```bash
mongod --dbpath <your-data-directory>
```

MongoDB is used for the audit log collection (`CourseManagementDB.audit_logs`). It must be running before starting the API.

### 2.3 Apply database migrations

```bash
cd backend/WebAPI
dotnet ef database update
```

This creates the SQL Server database and all tables. Seed data (roles, permissions, system settings, admin user) is applied automatically on first run.

### 2.4 Run the API

```bash
dotnet run --project backend/WebAPI
```

The API starts on `http://localhost:5131`.

- Swagger UI: `http://localhost:5131/swagger`
- SignalR hub: `http://localhost:5131/hubs/notifications`

**Default admin credentials:**
```
Email:    admin@university.edu
Password: Admin@1234
```

---

## 3. Frontend setup

### 3.1 Install dependencies

```bash
cd front-end
npm install
```

### 3.2 Environment variables

The file `front-end/.env` is already configured for local development:

```
VITE_API_URL=/api
```

All `/api` requests are proxied to `http://localhost:5131` and all `/hubs` requests are proxied with WebSocket support via `vite.config.ts`.

### 3.3 Run the dev server

```bash
npm run dev
```

The frontend starts on `http://localhost:8080`.

---

## 4. Running both together

Open two terminals:

```bash
# Terminal 1 — API
dotnet run --project backend/WebAPI

# Terminal 2 — Frontend
cd front-end && npm run dev
```

Then open `http://localhost:8080` in your browser.

---

## 5. Project structure

```
Course-Management/
├── backend/
│   └── WebAPI/
│       ├── Controllers/     # HTTP request handlers (no business logic)
│       ├── Services/        # Business logic layer
│       ├── Repositories/    # Data access layer (EF Core + MongoDB)
│       ├── Models/          # Entity models
│       ├── DTOs/            # Data transfer objects
│       ├── Hubs/            # SignalR real-time hub
│       ├── Interfaces/      # Service and repository contracts
│       ├── Migrations/      # EF Core SQL migrations
│       └── Data/            # DbContext (SQL + MongoDB)
└── front-end/
    └── src/
        ├── api/             # API call functions
        ├── components/      # Reusable UI components
        ├── hooks/           # Custom React hooks (incl. useSignalR)
        ├── lib/             # Axios client, SignalR service
        ├── pages/           # Route-level page components
        └── store/           # Zustand global state
```

---

## 6. API documentation

Full API documentation is available via Swagger once the backend is running:

```
http://localhost:5131/swagger
```

---

## 7. Additional features implemented

| Feature | Description |
|---------|-------------|
| **CMS** | Admin panel to edit static page content (titles, slogans, welcome messages) without touching business data |
| **Advanced Search** | Multi-parameter filtering across Courses, Students, Professors, Assignments and Audit Logs |
| **Dynamic Reports** | Analytics dashboard with department breakdowns, enrollment trends, top courses and professor workload |
| **Data Export / Import** | Export and import data as CSV, Excel (.xlsx) or JSON across five lists: Courses, Students, Professors, Assignments and Grades |

---


## 8. Real-time communication

The system uses **SignalR** for live notifications:

- Backend hub: `NotificationHub` at `/hubs/notifications`
- Frontend connects automatically on login via `useSignalR` hook
- Notifications are pushed to individual users via `user-{userId}` groups
- All notifications are also persisted in the SQL `Notifications` table
