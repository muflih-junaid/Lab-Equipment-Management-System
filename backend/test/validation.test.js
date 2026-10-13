const { test } = require("node:test");
const assert = require("node:assert/strict");
const { text, integer, id, date } = require("../src/utils/validation");
test("validation rejects malformed IDs and non-integer quantities", () => {
  for (const value of [0, -1, 1.5, "1", null])
    assert.throws(() => integer(value, "Quantity"));
  for (const value of ["1 OR 1=1", "0", "-2", "1.2", "9007199254740992"])
    assert.throws(() => id(value));
  assert.equal(id("12"), 12);
  assert.equal(integer(0, "Stock", 0), 0);
});
test("required strings and return dates are validated", () => {
  assert.throws(() => text("  ", "Name"));
  assert.throws(() => text({}, "Name"));
  assert.throws(() => date("2020-01-01"));
  assert.throws(() => date("2030-02-30"));
  assert.equal(date("2099-01-01"), "2099-01-01");
});
