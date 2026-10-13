function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
function text(value, label, max = 255) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label} is required (maximum ${max} characters)`);
  return value.trim();
}
function integer(value, label, min = 1) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > 4294967295
  )
    fail(400, `${label} must be an integer of at least ${min}`);
  return value;
}
function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    fail(400, "Invalid ID");
  return Number(value);
}
function date(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < new Date().toISOString().slice(0, 10)
  )
    fail(400, "Return date must be a valid date today or later (UTC)");
  return value;
}
module.exports = { fail, text, integer, id, date };
