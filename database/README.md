# Database

MariaDB schema and sample data for the website. Follow the repository [local setup guide](../README.md#local-setup).

- `schema.sql` **drops existing tables and deletes their data**. Import into a fresh database to preserve your original schema and seed work.
- `seed.sql` inserts development-only accounts, four categories, seven equipment entries, pending/approved/borrowed/rejected requests, and maintenance reports. Import it once after creating the tables.

## Tables

| Table | Responsibility |
|---|---|
| `users` | Unique email, bcrypt password hash, `user` or `admin` role |
| `categories` | Unique category names |
| `equipment` | Unique code, category, total/available quantity, location, status and active flag |
| `borrow_requests` | Requester, equipment, quantity, lifecycle status, approval details and return dates |
| `maintenance_reports` | Equipment, reporter, issue, status, resolution and timestamps |

One equipment row represents stock of identical units. Foreign keys restrict deleting records with history. Archival changes status and active flag instead of deleting equipment.

Checks prevent available quantity exceeding total quantity, non-positive loan quantities, invalid request dates, returned requests without return timestamps, and resolved reports without resolution timestamps. Backend transactions enforce stock conservation and valid lifecycle changes across tables.

Approval reserves stock. Student return requests keep stock reserved until an administrator confirms receipt. Resolving maintenance changes eligibility to borrow, not stock quantity. UTC is used for database connections and due-date calculations.

The previous `student` role is now `user`, and `damage_reports` is replaced by `maintenance_reports`. This is a new development schema, not a migration for existing data.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@lab.edu | Admin@123 |
| User | arjun@uni.edu | Student@123 |
| User | sara@uni.edu | Student@123 |

Never use these demo accounts for real deployment.
