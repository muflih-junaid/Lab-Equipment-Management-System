const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { text, fail } = require("../utils/validation");
function credentials(body) {
  const email = text(body.email, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(400, "Enter a valid email");
  if (
    typeof body.password !== "string" ||
    !body.password ||
    Buffer.byteLength(body.password) > 72
  )
    fail(400, "Password is required and must not exceed 72 bytes");
  return { email, password: body.password };
}
// A small in-memory throttle for this single-instance university application.
const attempts = new Map();
router.use((req, res, next) => {
  if (req.method !== "POST") return next();
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until < now) attempts.delete(key);
  const entry = attempts.get(req.ip) || { count: 0, until: now + 60000 };
  entry.count++;
  attempts.set(req.ip, entry);
  if (entry.count > 30)
    fail(429, "Too many authentication attempts; try again in one minute");
  next();
});
router.post("/register", async (req, res) => {
  const name = text(req.body.name, "Name", 100);
  const { email, password } = credentials(req.body);
  if (password.length < 8) fail(400, "Password must be at least 8 characters");
  if (
    req.body.confirmPassword !== undefined &&
    req.body.confirmPassword !== password
  )
    fail(400, "Passwords do not match");
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.execute(
    "INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)",
    [name, email, hash, "user"],
  );
  res
    .status(201)
    .json({
      message: "Account created successfully",
      user: { id: result.insertId, name, email, role: "user" },
    });
});
router.post("/login", async (req, res) => {
  const { email, password } = credentials(req.body);
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    fail(401, "Invalid email or password");
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "2h",
    algorithm: "HS256",
  });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});
router.get("/me", authenticate, (req, res) => res.json(req.user));
module.exports = router;
