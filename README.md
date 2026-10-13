# Lab Equipment Management System

A university lab website built with React, Express, and MariaDB. Students browse equipment, request loans, request returns, and report faults. Administrators manage stock, approve requests, record checkout and returns, and resolve maintenance reports.

The existing login and registration design is preserved. This repository currently contains the website and its local tests only.

## Architecture

```text
React pages → shared API client → Express routes → MariaDB connection pool
                      ↓                 ↓
                Bearer JWT       identity + role checks
```

- `frontend/src/App.jsx`: public, authenticated, and administrator routes.
- `frontend/src/auth/`: login state, session restoration, and logout.
- `frontend/src/api/client.js`: API base URL, JSON requests, tokens, and errors.
- `frontend/src/components/`: shared layout, form controls, and feedback.
- `frontend/src/pages/`: dashboards, equipment, loans, reports, profile, and users.
- `backend/server.js`: loads environment configuration and starts Express.
- `backend/src/app.js`: middleware, route mounting, statistics, and error handling.
- `backend/src/routes/`: authentication, equipment, borrowing, and maintenance APIs.
- `backend/src/services/`: borrowing rules and transaction management.
- `backend/src/middleware/auth.js`: JWT verification and administrator checks.
- `backend/src/db/pool.js`: pooled, parameterized database access.
- `backend/src/utils/validation.js`: authoritative input checks.
- `backend/test/`: input-validation and real-database API tests.
- `database/`: schema, demo data, and database documentation.

## Local setup

Prerequisites: Node.js 22.12 or newer, npm, and an already installed MariaDB server. No operating-system installation steps are needed here.

From the repository root:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Database

**The new schema replaces the original individual-item model with quantity-based stock. `schema.sql` drops tables and deletes their data. Do not run it against your existing database unless you intend to reset it.** Use a fresh database to preserve existing work.

Open MariaDB with an account that can create databases and users. The following example uses a new database and application user:

```sql
CREATE DATABASE lab_equipment_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lab_website'@'localhost' IDENTIFIED BY 'choose-a-local-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_equipment_website.* TO 'lab_website'@'localhost';
```

Import the schema and seed using your database administrator account (replace `root` if necessary):

```bash
mariadb -u root -p lab_equipment_website < database/schema.sql
mariadb -u root -p lab_equipment_website < database/seed.sql
```

### Backend configuration

If `backend/.env` already exists, edit it rather than overwriting your credentials. Otherwise copy `backend/.env.example` to `backend/.env`. Set:

```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=lab_website
DB_PASSWORD=your-local-password
DB_NAME=lab_equipment_website
JWT_SECRET=your-generated-random-secret
CORS_ORIGIN=http://localhost:5173
```

Generate a JWT secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Place the output in `JWT_SECRET`. Environment files are ignored by Git. Never commit actual credentials. Previously committed secrets remain in Git history and must be rotated if they have been shared.

Start the backend from its own folder so dotenv reads the correct file:

```bash
cd backend
npm run dev
```

### Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Vite forwards `/api` requests to the backend at port 5000. For a different backend address, use `VITE_API_URL` as shown in `frontend/.env.example`, and restart Vite. If Vite uses a different origin, update backend `CORS_ORIGIN` too.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@lab.edu | Admin@123 |
| User | arjun@uni.edu | Student@123 |
| User | sara@uni.edu | Student@123 |

These accounts are for local demonstrations only. Public registration always creates a `user`, regardless of submitted role fields.

## Authentication flow

1. Registration validates the name, normalized email, and password. bcrypt stores a hash, and a unique email constraint prevents duplicates.
2. Login compares the hash and returns a JWT expiring after two hours.
3. React keeps the token in session storage and user information in authentication context.
4. The API client sends `Authorization: Bearer <token>` with each request.
5. The backend verifies the token and loads the current user and role from MariaDB. Role and ownership checks run on the server; hiding UI actions is not a security boundary.
6. Reloading the page calls `/auth/me`. Logout clears the token locally; expired tokens cause a redirect to login.

Session storage is accessible to JavaScript, so preventing XSS matters. React text rendering escapes descriptions and report text. Logout does not revoke an already copied token; it remains usable until expiry.

## Borrowing flow

```text
PENDING → APPROVED → BORROWED → RETURN_REQUESTED → RETURNED
   ↓          ↓         └────────────────────────→ RETURNED (admin receipt)
REJECTED   CANCELLED
   └─ PENDING may also be CANCELLED
```

- A request must have a positive integer quantity, enough available stock, and a valid return date today or later. Dates use UTC.
- Pending requests do not reserve inventory. Approval rechecks and reserves stock inside a transaction.
- The administrator records checkout; quantity is not subtracted twice.
- A student requests a return and physically hands equipment to lab staff. Requested returns keep stock reserved.
- Only an administrator confirms receipt. Status and actual return date change together, and stock is restored exactly once.
- Cancelling an approved reservation also restores stock. Rejection or cancellation of a pending request changes no inventory.
- Row locks serialize competing approvals. Invalid state transitions return `409`.
- Overdue is calculated for outstanding loans from the expected return date, rather than stored as a separate lifecycle state.

## Maintenance flow

A user submits an `OPEN` report. An administrator can start maintenance (`IN_PROGRESS`), blocking new approvals and checkouts for the equipment entry. Resolution requires a written explanation. Resolving the last in-progress report restores availability unless the entry was archived. An open report may also be resolved without starting maintenance.

Equipment entries represent groups of identical units. Maintenance blocks the whole entry; this version does not identify individual faulty units. Available quantity still tracks stock reservations while equipment is under maintenance or archived.

## API overview

All paths below start with `/api`. Authentication is required except for registration, login, and health.

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Public |
| GET | `/health` | Public; checks DB connectivity |
| GET | `/auth/me`, `/categories` | Authenticated |
| GET | `/equipment`, `/equipment/:id` | Authenticated; users cannot see archived entries |
| POST | `/equipment` | Admin |
| PUT | `/equipment/:id` | Admin |
| PATCH | `/equipment/:id/status` | Admin |
| POST | `/borrow-requests` | Authenticated |
| GET | `/borrow-requests/me` | Own records |
| GET | `/borrow-requests` | Admin |
| GET | `/borrow-requests/:id` | Owner or admin |
| PATCH | `/borrow-requests/:id/approve`, `/reject`, `/borrow` | Admin |
| PATCH | `/borrow-requests/:id/return` | Owner requests return; admin confirms receipt |
| PATCH | `/borrow-requests/:id/cancel` | Owner or admin, before checkout |
| POST | `/maintenance` | Authenticated |
| GET | `/maintenance/me` | Own reports |
| GET | `/maintenance` | Admin |
| GET | `/maintenance/:id` | Reporter or admin |
| PATCH | `/maintenance/:id/status`, `/maintenance/:id/resolve` | Admin |
| GET | `/users`, `/dashboard/stats` | Admin |

Equipment filters: `search`, `category`, `status`, and `available=true`. Equipment status is `AVAILABLE`, `UNDER_MAINTENANCE`, or `ARCHIVED`. Stock availability is calculated from total quantity minus active reservations; administrators edit total quantity, not arbitrary available quantity.

## Verification

From the repository root:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
npm run lint --prefix backend
npm test --prefix backend
```

Backend `lint` performs JavaScript syntax checks. The ordinary test command runs input-validation tests; real-database integration tests are skipped unless `TEST_DB_NAME` is supplied.

For integration tests, create a **separate disposable database whose name ends in `_test`** and grant a test user permission to create/drop its tables. Tests reset and seed that database on every run. Do not point them at your application database.

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=your_test_user DB_PASSWORD=your_test_password TEST_DB_NAME=lab_equipment_test npm test --prefix backend
```

Integration tests cover registration, duplicate emails, login, access control, equipment creation, loan approval/checkout/return, rejected and cancelled requests, simultaneous approvals, maintenance, and archival. They use Node's built-in test runner and HTTP fetch; no test framework is added.

Manual website test:

1. Log in as a user. Search/filter equipment and submit a borrow request.
2. Sign out and log in as admin. Approve it, check the stock decrease, and record checkout.
3. Log back in as the user and request a return. Stock should remain reserved.
4. As admin, confirm receipt. Stock should increase once and the loan should become returned.
5. Report an issue as a user. As admin, start maintenance, verify borrowing is blocked, and resolve it.
6. Add/edit/archive equipment. Archived equipment disappears for users, while history stays visible.
7. Try opening `/admin` as a user and opening authenticated pages after logout. Access should be blocked.

## Current limits

- Admin-wide lists are capped at 500 records; pagination is not implemented.
- Profile viewing is supported; editing accounts and resetting passwords are not included.
- Authentication throttling is in memory for one backend instance.
- Statistics count stock units for available/borrowed quantities and catalogue entries for total/maintenance equipment.
- Real-database tests exercise API behavior. Automated browser tests are not included.
