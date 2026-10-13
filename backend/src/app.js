const express = require("express");
const cors = require("cors");
const db = require("./db/pool");
const { authenticate, admin } = require("./middleware/auth");
const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body === undefined)
    req.body = {};
  if (
    req.body !== undefined &&
    (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
  )
    return res
      .status(400)
      .json({ message: "Request body must be a JSON object" });
  next();
});
app.get("/", (req, res) =>
  res.json({ message: "Lab Equipment Management API" }),
);
app.get("/api/health", async (req, res) => {
  await db.query("SELECT 1");
  res.json({ status: "ok" });
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api", authenticate);
app.get("/api/categories", async (req, res) => {
  const [rows] = await db.query("SELECT id,name FROM categories ORDER BY name");
  res.json(rows);
});
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/borrow-requests", require("./routes/borrowing"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.get("/api/users", admin, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id,name,email,role,created_at FROM users ORDER BY id DESC LIMIT 500",
  );
  res.json(rows);
});
app.get("/api/dashboard/stats", admin, async (req, res) => {
  const [rows] = await db.query(`SELECT
 (SELECT COUNT(*) FROM equipment WHERE is_active=1) AS total_equipment,
 (SELECT COALESCE(SUM(available_quantity),0) FROM equipment WHERE is_active=1 AND status='AVAILABLE') AS available_equipment,
 (SELECT COALESCE(SUM(quantity),0) FROM borrow_requests WHERE status IN ('BORROWED','RETURN_REQUESTED')) AS borrowed_equipment,
 (SELECT COUNT(*) FROM equipment WHERE is_active=1 AND status='UNDER_MAINTENANCE') AS maintenance_equipment,
 (SELECT COUNT(*) FROM borrow_requests WHERE status='PENDING') AS pending_requests,
 (SELECT COUNT(*) FROM borrow_requests WHERE status IN ('BORROWED','RETURN_REQUESTED') AND expected_return_date<UTC_DATE()) AS overdue_requests,
 (SELECT COUNT(*) FROM users) AS total_users`);
  const [recent] = await db.query(
    "SELECT r.id,r.status,r.updated_at,e.name AS equipment_name FROM borrow_requests r JOIN equipment e ON e.id=r.equipment_id ORDER BY r.updated_at DESC LIMIT 8",
  );
  res.json({ ...rows[0], recent_activity: recent });
});
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500,
    message = error.message;
  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON request body";
  }
  if (error.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  }
  if (error.code === "ER_DUP_ENTRY") {
    status = 409;
    message = "Email or equipment code already exists";
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    status = 400;
    message = "Referenced record does not exist";
  }
  if (status >= 500) {
    console.error(error);
    message = "Internal server error";
  }
  res.status(status).json({ message });
});
module.exports = app;
