const transaction = require("./transaction");
const { fail, id, integer, date } = require("../utils/validation");
async function create(user, body) {
  const equipmentId = id(body.equipment_id),
    quantity = integer(body.quantity, "Quantity"),
    returnDate = date(body.expected_return_date);
  return transaction(async (c) => {
    const [rows] = await c.execute(
      "SELECT * FROM equipment WHERE id=? FOR UPDATE",
      [equipmentId],
    );
    const e = rows[0];
    if (
      !e ||
      !e.is_active ||
      e.status !== "AVAILABLE" ||
      e.available_quantity < quantity
    )
      fail(409, "Equipment is not available in this quantity");
    const [result] = await c.execute(
      "INSERT INTO borrow_requests (user_id,equipment_id,quantity,expected_return_date) VALUES (?,?,?,?)",
      [user.id, equipmentId, quantity, returnDate],
    );
    return { id: result.insertId, message: "Borrow request submitted" };
  });
}
async function transition(user, requestId, action) {
  return transaction(async (c) => {
    // Lock inventory first for a consistent lock order across workflows.
    const [lookup] = await c.execute(
      "SELECT equipment_id FROM borrow_requests WHERE id=?",
      [id(requestId)],
    );
    if (!lookup[0]) fail(404, "Request not found");
    const [equipment] = await c.execute(
      "SELECT * FROM equipment WHERE id=? FOR UPDATE",
      [lookup[0].equipment_id],
    );
    const [rows] = await c.execute(
      "SELECT * FROM borrow_requests WHERE id=? FOR UPDATE",
      [id(requestId)],
    );
    const r = rows[0],
      e = equipment[0];
    const isAdmin = user.role === "admin";
    if (
      !isAdmin &&
      (!["cancel", "return"].includes(action) || r.user_id !== user.id)
    )
      fail(403, "You cannot perform this action");
    const allowed = {
      approve: ["PENDING"],
      reject: ["PENDING"],
      borrow: ["APPROVED"],
      return: isAdmin ? ["BORROWED", "RETURN_REQUESTED"] : ["BORROWED"],
      cancel: ["PENDING", "APPROVED"],
    };
    if (!allowed[action]?.includes(r.status))
      fail(409, `Cannot ${action} a ${r.status.toLowerCase()} request`);
    let status;
    if (action === "approve") {
      if (
        !e.is_active ||
        e.status !== "AVAILABLE" ||
        e.available_quantity < r.quantity ||
        r.expected_return_date < new Date().toISOString().slice(0, 10)
      )
        fail(409, "Stock unavailable or return date has passed");
      await c.execute(
        "UPDATE equipment SET available_quantity=available_quantity-? WHERE id=?",
        [r.quantity, e.id],
      );
      await c.execute(
        "UPDATE borrow_requests SET approved_by=?,approved_at=UTC_TIMESTAMP() WHERE id=?",
        [user.id, r.id],
      );
      status = "APPROVED";
    } else if (action === "borrow") {
      if (!e.is_active || e.status !== "AVAILABLE")
        fail(409, "Equipment is archived or under maintenance");
      status = "BORROWED";
      await c.execute(
        "UPDATE borrow_requests SET borrow_date=UTC_TIMESTAMP() WHERE id=?",
        [r.id],
      );
    } else if (action === "return") {
      status = isAdmin ? "RETURNED" : "RETURN_REQUESTED";
    } else status = action === "reject" ? "REJECTED" : "CANCELLED";
    if (
      status === "RETURNED" ||
      (action === "cancel" && r.status === "APPROVED")
    )
      await c.execute(
        "UPDATE equipment SET available_quantity=available_quantity+? WHERE id=?",
        [r.quantity, e.id],
      );
    await c.execute(
      "UPDATE borrow_requests SET status=?,actual_return_date=IF(?='RETURNED',UTC_TIMESTAMP(),NULL) WHERE id=?",
      [status, status, r.id],
    );
    return {
      message:
        status === "RETURN_REQUESTED"
          ? "Return requested. Bring the equipment to the lab for confirmation."
          : `Request ${status.toLowerCase()}`,
    };
  });
}
module.exports = { create, transition };
