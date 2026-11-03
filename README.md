# 🏢 AssetFlow Pro — Enterprise Asset Management Platform

> **Full MERN Stack Enterprise Solution** with real-time analytics, automated custody workflows, overlap-free resource reservations, diagnostic maintenance lifecycles, and cryptographic audit logs.

---

## 🌟 1. Project Overview

**AssetFlow Pro** is a centralized Enterprise Asset Management (EAM) platform built to track physical hardware equipment, employee allocations, shared resource reservations, vendor maintenance ticketing, and organizational compliance records.

Built for high reliability, **AssetFlow Pro** features a responsive dark-navy SaaS dashboard, server-side role enforcement (ADMIN, MANAGER, EMPLOYEE), automated hardware state machines, and real-time MongoDB aggregations.

### Core Capabilities:
- **Comprehensive Asset Registry**: Complete lifecycle tracking with unique Asset IDs, category classifications, serial numbers, locations, and real-time custody states.
- **Dynamic Digital QR Code Tags**: High-resolution printable/downloadable QR tags for physical hardware labeling and mobile verification.
- **Personnel Directory & Custody Management**: Track active employees, department assignments, and active hardware possessions.
- **Intelligent Asset Allocation**: Prevents double-allocation of deployed hardware and manages seamless check-in returns.
- **Resource Reservation Engine with Overlap Prevention**: Allows staff to book projectors, cameras, and test handsets with automatic conflict detection.
- **Maintenance Lifecycle & State Synchronization**: Automates status transitions (`Available` ➔ `Under Maintenance` ➔ `Available`) as service tickets progress.
- **Immutable Server Audit Logs**: Automatic backend compliance logging of every allocation, review, edit, and access event.
- **Zero-Config Instant Local Execution**: Runs out-of-the-box using embedded MongoDB fallback, or connects seamlessly to MongoDB Atlas.

---

## 🛠️ 2. Technology Stack

### Frontend
- **React.js 18** & **Vite 6** (Modern, lightning-fast compilation and HMR)
- **Tailwind CSS 3** (Custom SaaS design system, dark navy sidebar, crisp layout)
- **React Router DOM 6** (Nested routes, layout shells, role-based route guards)
- **Axios** (Centralized API client with JWT request/response interceptors)
- **Recharts** (Interactive Donut, Bar, and Area visual analytics)
- **Lucide React** (Clean, enterprise iconography)
- **QRCode.react** & **Canvas-Confetti** (Interactive digital tags and UX rewards)

### Backend
- **Node.js 20+** & **Express.js 4** (Clean RESTful MVC architecture)
- **Mongoose 8** (Schema validation, ObjectId relationships, aggregation pipelines)
- **MongoDB Atlas** / **MongoMemoryServer** (Resilient hybrid database support)
- **JSON Web Tokens (JWT)** (Stateless bearer authentication)
- **Bcrypt.js** (Salted cryptographic password hashing)
- **QRCode** (Server-side asset tag generation)
- **Morgan & CORS** (HTTP logging and cross-origin resource sharing)

---

## 📐 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AssetFlow Pro Frontend                    │
│             (React 18 + Vite + Tailwind CSS)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP REST APIs
                               │ Authorization: Bearer <JWT>
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js REST API                      │
│                                                             │
│  [Auth Middleware] ──► [Role Authorizer] ──► [Controllers]  │
│                                                     │       │
│                                            [Audit Service]  │
└──────────────────────────────┬──────────────────────┬───────┘
                               │                      │
                  Mongoose ODM │                      │ Automatic
                               ▼                      │ Audit Logs
┌─────────────────────────────────────────────────────▼───────┐
│                    MongoDB Database                         │
│   • Users         • Assets         • Assignments            │
│   • Employees     • Bookings       • Maintenance            │
│                   • AuditLogs                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 4. Project Folder Structure

```
assetflow-pro/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection & in-memory fallback
│   ├── controllers/
│   │   ├── assetController.js        # Asset CRUD, search, filter & QR tags
│   │   ├── assignmentController.js   # Allocation & return workflows
│   │   ├── auditController.js        # Admin audit log queries
│   │   ├── authController.js         # Register, login, profile, password
│   │   ├── bookingController.js      # Reservations & overlap prevention
│   │   ├── dashboardController.js    # Real-time metrics & chart datasets
│   │   ├── employeeController.js     # Employee directory & asset tracking
│   │   └── maintenanceController.js  # Service tickets & status transitions
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & role authorization
│   │   └── errorMiddleware.js    # Centralized error & 404 handlers
│   ├── models/
│   │   ├── Asset.js              # Hardware asset schema & indexes
│   │   ├── Assignment.js         # Custody allocation schema
│   │   ├── AuditLog.js           # Security & activity audit schema
│   │   ├── Booking.js            # Resource reservation schema
│   │   ├── Employee.js           # Organization staff schema
│   │   ├── Maintenance.js        # Diagnostic service ticket schema
│   │   └── User.js               # System account schema with bcrypt
│   ├── routes/
│   │   ├── assetRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── auditRoutes.js
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── employeeRoutes.js
│   │   └── maintenanceRoutes.js
│   ├── scripts/
│   │   ├── seed.js               # Database seeding (18 assets, 5 accounts)
│   │   └── testIntegration.js    # Comprehensive automated test suite
│   ├── services/
│   │   └── auditService.js       # Non-blocking immutable audit logger
│   ├── utils/
│   │   └── generateToken.js      # JWT signing utility
│   ├── server.js                 # Express server entry point
│   ├── .env                      # Active environment configuration
│   ├── .env.example              # Template configuration
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg           # Enterprise branding favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── assets/           # QRCodeModal, AssetFormModal
│   │   │   ├── common/           # StatCard, DataTable, Modal, ConfirmDialog,
│   │   │   │                     # FormInput, SearchBar, StatusBadge, Pagination
│   │   │   └── layout/           # Sidebar, Navbar
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state & session restore
│   │   │   └── NotificationContext.jsx # Toast notification engine
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Master dashboard shell
│   │   ├── pages/
│   │   │   ├── assets/           # AssetsList, AssetDetail
│   │   │   ├── assignments/      # AssignmentsList (Allocate & Check In)
│   │   │   ├── audit/            # AuditLogsList (Compliance stream)
│   │   │   ├── auth/             # Login, Register
│   │   │   ├── bookings/         # BookingsList (Reserve & Review)
│   │   │   ├── dashboard/        # Dashboard (KPIs, Charts, Feeds)
│   │   │   ├── employees/        # EmployeesList, EmployeeDetail
│   │   │   ├── maintenance/      # MaintenanceList (Service tickets)
│   │   │   ├── settings/         # Settings (Profile & Passwords)
│   │   │   └── NotFound.jsx      # 404 handler
│   │   ├── services/             # Axios API services for all modules
│   │   ├── utils/                # formatters.js, exportCsv.js
│   │   ├── App.jsx               # Route definitions & protected guards
│   │   ├── main.jsx              # React DOM mounting
│   │   └── index.css             # Tailwind utilities & custom scrollbars
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── package.json                  # Root monorepo orchestrator
└── README.md
```

---

## 🔑 5. Demo Credentials

The login screen provides **one-click demo account filling** for rapid evaluation:

| Role | Email Address | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@assetflow.com` | `Admin@123` | Full access: manage users, delete assets, approve workflows, view audit trail |
| **MANAGER** | `manager@assetflow.com` | `Manager@123` | Operational access: manage assets, allocate equipment, approve bookings |
| **EMPLOYEE** | `employee1@assetflow.com` | `Employee@123` | Self-service: view assigned hardware, reserve resources, submit repairs |

---

## 🚀 6. Installation & Execution

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Option A: Quick-Start (Automatic In-Memory MongoDB)
No local MongoDB installation or cloud account is required to test immediately. The backend automatically boots an embedded MongoDB instance if no external database is configured.

1. **Clone or Navigate to the Project:**
   ```bash
   cd C:\Users\joshi\.gemini\antigravity\scratch\assetflow-pro
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Backend Server:**
   ```bash
   cd ../backend
   npm start
   # Server launches on http://localhost:5000 with automatic initial database seeding!
   ```

5. **Start Frontend Development Server (in a new terminal):**
   ```bash
   cd ../frontend
   npm run dev
   # Vite UI opens on http://localhost:5173
   ```

---

## ☁️ 7. MongoDB Atlas Configuration

To connect AssetFlow Pro to your dedicated cloud database:

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. `Cluster0`).
3. Under **Database Access**, create a user with read and write privileges.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere).
5. Click **Connect** ➔ **Connect your application** (Driver: Node.js) and copy the URI.
6. Open `backend/.env` and update `MONGO_URI`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/assetflow_pro?retryWrites=true&w=majority
   JWT_SECRET=assetflow_pro_super_secret_jwt_key_enterprise_2026
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```
7. Reset and seed your cloud database:
   ```bash
   cd backend
   npm run seed
   ```

---

## 📡 8. REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated profile |
| `PUT` | `/api/auth/profile` | Private | Update user profile details |
| `PUT` | `/api/auth/change-password` | Private | Update user password |

### Dashboard Telemetry (`/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Private | Aggregate counters, charts & feeds |

### Asset Management (`/api/assets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assets` | Private | List assets with search, filter, sort & pagination |
| `POST` | `/api/assets` | Admin / Manager | Register a new physical hardware asset |
| `GET` | `/api/assets/:id` | Private | Retrieve asset profile, specs, & history |
| `PUT` | `/api/assets/:id` | Admin / Manager | Modify asset specifications or location |
| `DELETE`| `/api/assets/:id` | Admin Only | Delete an unassigned asset |
| `GET` | `/api/assets/:id/qrcode` | Private | Generate/fetch asset digital QR code tag |

### Employee Management (`/api/employees`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Private | Directory of employees & assigned assets |
| `POST` | `/api/employees` | Admin / Manager | Register new employee |
| `GET` | `/api/employees/:id` | Private | Employee profile & custody breakdown |
| `PUT` | `/api/employees/:id` | Admin / Manager | Update employee department or status |
| `DELETE`| `/api/employees/:id` | Admin Only | Delete employee (checks active assets) |

### Asset Allocations (`/api/assignments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assignments` | Private | View active and returned custody allocations |
| `POST` | `/api/assignments` | Admin / Manager | Allocate Available asset to Active employee |
| `POST` | `/api/assignments/:id/return` | Admin / Manager | Check in return and reset status to Available |

### Resource Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings` | Private | View bookings (role-filtered) |
| `POST` | `/api/bookings` | Private | Submit resource reservation request |
| `PUT` | `/api/bookings/:id/status` | Admin / Manager | Approve or Reject booking request |
| `PUT` | `/api/bookings/:id/cancel` | Private | Cancel pending or approved booking |

### Maintenance & Repairs (`/api/maintenance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | Private | View service tickets & diagnostics |
| `POST` | `/api/maintenance` | Private | Submit hardware repair ticket |
| `PUT` | `/api/maintenance/:id` | Admin / Manager | Update status, assign technician, log cost |

### Audit Logs (`/api/audit-logs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | Admin Only | Full compliance log stream with JSON inspection |

---

## 🧪 9. Automated Testing

To run the automated end-to-end integration test suite:

```bash
cd backend
node scripts/testIntegration.js
```

### Test Suite Validations:
1. System Health probe (`200 OK`)
2. Admin, Manager, and Employee JWT authentication
3. Server-side role enforcement (verifying `403 Forbidden` for unauthorized routes)
4. Dashboard MongoDB aggregations (counting metrics, category breakdowns, valuations)
5. Asset CRUD, serial uniqueness, and QR code tag generation
6. Asset allocation and return with automatic state transitions
7. Resource booking overlap detection and collision prevention (`400 Bad Request`)
8. Maintenance lifecycle and asset availability synchronization
9. Cryptographic audit log entry generation across all operations

---

## 🛡️ 10. Security Implementation

- **Bcrypt Salted Hashing**: Passwords are never stored in plaintext and never returned in API payloads (`select: false`).
- **JWT Authentication**: Protected endpoints enforce valid, unexpired tokens in the `Authorization: Bearer <token>` header.
- **Server-Side Role Guarding**: Critical actions (e.g., deleting assets, viewing audit logs, approving bookings) are strictly authorized on the Express layer.
- **Input Sanitization & Unique Constraints**: Unique indexes enforce unique `assetId`, `serialNumber`, `employeeId`, and `email`.
- **CORS Configuration**: Restricts and controls cross-origin HTTP verbs and header allowances.
