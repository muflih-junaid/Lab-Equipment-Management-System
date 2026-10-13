const router = require("express").Router();
const db = require("../db/pool");
const transaction = require("../services/transaction");
const { admin } = require("../middleware/auth");
const { id, text, fail } = require("../utils/validation");
const select =
  "SELECT m.*,e.name AS equipment_name,u.name AS reporter_name FROM maintenance_reports m JOIN equipment e ON e.id=m.equipment_id JOIN users u ON u.id=m.reported_by";
router.post("/", async (req, res) => {
  const equipmentId = id(req.body.equipment_id),
    description = text(req.body.issue_description, "Issue description", 5000);
  const [rows] = await db.execute(
    "SELECT id FROM equipment WHERE id=? AND is_active=1",
    [equipmentId],
  );
  if (!rows[0]) fail(404, "Equipment not found");
  const [result] = await db.execute(
    "INSERT INTO maintenance_reports (equipment_id,reported_by,issue_description) VALUES (?,?,?)",
    [equipmentId, req.user.id, description],
  );
  res.status(201).json({ id: result.insertId, message: "Issue reported" });
});
router.get("/me", async (req, res) => {
  const [rows] = await db.execute(
    select + " WHERE m.reported_by=? ORDER BY m.id DESC",
    [req.user.id],
  );
  res.json(rows);
});
router.get("/", admin, async (req, res) => {
  const [rows] = await db.execute(select + " ORDER BY m.id DESC LIMIT 500");
  res.json(rows);
});
router.get("/:id", async (req, res) => {
  const [rows] = await db.execute(select + " WHERE m.id=?", [
    id(req.params.id),
  ]);
  if (!rows[0]) fail(404, "Report not found");
  if (req.user.role !== "admin" && rows[0].reported_by !== req.user.id)
    fail(403, "This report belongs to another user");
  res.json(rows[0]);
});
async function update(req, res, resolve) {
  const reportId = id(req.params.id),
    status = resolve ? "RESOLVED" : req.body.status;
  if (!resolve && status !== "IN_PROGRESS")
    fail(400, "Choose IN_PROGRESS or resolve the report");
  const resolution = resolve
    ? text(req.body.resolution, "Resolution", 5000)
    : null;
  await transaction(async (c) => {
    const [lookup] = await c.execute(
      "SELECT equipment_id FROM maintenance_reports WHERE id=?",
      [reportId],
    );
    if (!lookup[0]) fail(404, "Report not found");
    const equipmentId = lookup[0].equipment_id;
    await c.execute("SELECT id FROM equipment WHERE id=? FOR UPDATE", [
      equipmentId,
    ]);
    const [rows] = await c.execute(
      "SELECT * FROM maintenance_reports WHERE id=? FOR UPDATE",
      [reportId],
    );
    if (
      rows[0].status === "RESOLVED" ||
      (status === "IN_PROGRESS" && rows[0].status !== "OPEN")
    )
      fail(409, "Invalid maintenance transition");
    await c.execute(
      "UPDATE maintenance_reports SET status=?,resolution=?,resolved_at=IF(?='RESOLVED',UTC_TIMESTAMP(),NULL) WHERE id=?",
      [status, resolution, status, reportId],
    );
    if (status === "IN_PROGRESS")
      await c.execute(
        "UPDATE equipment SET status='UNDER_MAINTENANCE' WHERE id=? AND is_active=1",
        [equipmentId],
      );
    else {
      const [open] = await c.execute(
        "SELECT id FROM maintenance_reports WHERE equipment_id=? AND status='IN_PROGRESS'",
        [equipmentId],
      );
      if (rows[0].status === "IN_PROGRESS" && !open.length)
        await c.execute(
          "UPDATE equipment SET status='AVAILABLE' WHERE id=? AND is_active=1 AND status='UNDER_MAINTENANCE'",
          [equipmentId],
        );
    }
  });
  res.json({ message: resolve ? "Report resolved" : "Maintenance started" });
}
router.patch("/:id/status", admin, (req, res) => update(req, res, false));
router.patch("/:id/resolve", admin, (req, res) => update(req, res, true));
module.exports = router;
