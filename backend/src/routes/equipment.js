const router = require("express").Router();
const db = require("../db/pool");
const transaction = require("../services/transaction");
const { admin } = require("../middleware/auth");
const { text, integer, id, fail } = require("../utils/validation");
router.get("/", async (req, res) => {
  const where = ["1=1"],
    params = [];
  if (req.user.role !== "admin") where.push("e.is_active = 1");
  if (req.query.search) {
    where.push("(e.name LIKE ? OR e.equipment_code LIKE ?)");
    const term = `%${text(req.query.search, "Search", 100)}%`;
    params.push(term, term);
  }
  if (req.query.category) {
    where.push("e.category_id = ?");
    params.push(id(req.query.category));
  }
  if (req.query.status) {
    where.push("e.status = ?");
    params.push(text(req.query.status, "Status", 30));
  }
  if (req.query.available === "true")
    where.push(
      "e.available_quantity > 0 AND e.status = 'AVAILABLE' AND e.is_active = 1",
    );
  const [rows] = await db.execute(
    `SELECT e.*, c.name AS category_name FROM equipment e JOIN categories c ON c.id=e.category_id WHERE ${where.join(" AND ")} ORDER BY e.name LIMIT 500`,
    params,
  );
  res.json(rows);
});
router.get("/:id", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT e.*,c.name AS category_name FROM equipment e JOIN categories c ON c.id=e.category_id WHERE e.id=?",
    [id(req.params.id)],
  );
  if (!rows[0] || (!rows[0].is_active && req.user.role !== "admin"))
    fail(404, "Equipment not found");
  res.json(rows[0]);
});
function fields(body) {
  const total = integer(body.total_quantity, "Total quantity", 0);
  return [
    text(body.equipment_code, "Equipment code", 50),
    text(body.name, "Name", 150),
    typeof body.description === "string" ? body.description.slice(0, 5000) : "",
    id(body.category_id),
    total,
    text(body.location, "Location", 100),
  ];
}
router.post("/", admin, async (req, res) => {
  const values = fields(req.body);
  const [result] = await db.execute(
    "INSERT INTO equipment (equipment_code,name,description,category_id,total_quantity,location,available_quantity) VALUES (?,?,?,?,?,?,?)",
    [...values, values[4]],
  );
  res.status(201).json({ id: result.insertId, message: "Equipment created" });
});
router.put("/:id", admin, async (req, res) => {
  const values = fields(req.body),
    equipmentId = id(req.params.id);
  await transaction(async (c) => {
    const [rows] = await c.execute(
      "SELECT * FROM equipment WHERE id=? FOR UPDATE",
      [equipmentId],
    );
    if (!rows[0]) fail(404, "Equipment not found");
    const reserved = rows[0].total_quantity - rows[0].available_quantity;
    if (values[4] < reserved)
      fail(409, "Total quantity cannot be lower than reserved/borrowed stock");
    await c.execute(
      "UPDATE equipment SET equipment_code=?,name=?,description=?,category_id=?,total_quantity=?,location=?,available_quantity=? WHERE id=?",
      [...values, values[4] - reserved, equipmentId],
    );
  });
  res.json({ message: "Equipment updated" });
});
router.patch("/:id/status", admin, async (req, res) => {
  const status = req.body.status;
  if (!["AVAILABLE", "UNDER_MAINTENANCE", "ARCHIVED"].includes(status))
    fail(400, "Invalid equipment status");
  await transaction(async (c) => {
    const equipmentId = id(req.params.id);
    const [rows] = await c.execute(
      "SELECT id FROM equipment WHERE id=? FOR UPDATE",
      [equipmentId],
    );
    if (!rows[0]) fail(404, "Equipment not found");
    if (status === "AVAILABLE") {
      const [reports] = await c.execute(
        "SELECT id FROM maintenance_reports WHERE equipment_id=? AND status='IN_PROGRESS'",
        [equipmentId],
      );
      if (reports.length)
        fail(409, "Resolve active maintenance before restoring equipment");
    }
    await c.execute("UPDATE equipment SET status=?,is_active=? WHERE id=?", [
      status,
      status === "ARCHIVED" ? 0 : 1,
      equipmentId,
    ]);
  });
  res.json({ message: "Equipment status updated" });
});
module.exports = router;
