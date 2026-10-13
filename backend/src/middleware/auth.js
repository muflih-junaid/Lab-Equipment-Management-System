const jwt = require("jsonwebtoken");
const db = require("../db/pool");
const { fail } = require("../utils/validation");
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token)
    return next(
      Object.assign(new Error("Authentication required"), { status: 401 }),
    );
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return next(
      Object.assign(new Error("Session expired or invalid"), { status: 401 }),
    );
  }
  const [users] = await db.execute(
    "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
    [payload.sub],
  );
  if (!users[0]) fail(401, "User no longer exists");
  req.user = users[0];
  next();
}
function admin(req, res, next) {
  if (req.user.role !== "admin") fail(403, "Administrator access required");
  next();
}
module.exports = { authenticate, admin };
