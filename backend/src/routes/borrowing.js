const router = require("express").Router();
const db = require("../db/pool");
const { admin } = require("../middleware/auth");
const { id, fail } = require("../utils/validation");
const service = require("../services/borrowing");
const select = `SELECT r.*,e.name AS equipment_name,e.equipment_code,u.name AS user_name,
 (r.status IN ('BORROWED','RETURN_REQUESTED') AND r.expected_return_date<UTC_DATE()) AS is_overdue
 FROM borrow_requests r JOIN equipment e ON e.id=r.equipment_id JOIN users u ON u.id=r.user_id`;
router.post("/", async (req, res) =>
  res.status(201).json(await service.create(req.user, req.body)),
);
router.get("/me", async (req, res) => {
  const [rows] = await db.execute(
    select + " WHERE r.user_id=? ORDER BY r.id DESC",
    [req.user.id],
  );
  res.json(rows);
});
router.get("/", admin, async (req, res) => {
  const [rows] = await db.execute(select + " ORDER BY r.id DESC LIMIT 500");
  res.json(rows);
});
router.get("/:id", async (req, res) => {
  const [rows] = await db.execute(select + " WHERE r.id=?", [
    id(req.params.id),
  ]);
  if (!rows[0]) fail(404, "Request not found");
  if (req.user.role !== "admin" && rows[0].user_id !== req.user.id)
    fail(403, "This request belongs to another user");
  res.json(rows[0]);
});
for (const action of ["approve", "reject", "borrow", "return", "cancel"])
  router.patch(`/:id/${action}`, async (req, res) =>
    res.json(await service.transition(req.user, req.params.id, action)),
  );
module.exports = router;
