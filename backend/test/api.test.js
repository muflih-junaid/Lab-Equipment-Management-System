const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
// Integration tests reset ONLY an explicitly selected disposable *_test database.
const enabled = Boolean(process.env.TEST_DB_NAME);
test("REST API integration with MariaDB", { skip: !enabled }, async (t) => {
  assert.match(
    process.env.TEST_DB_NAME,
    /^[a-zA-Z0-9_]+_test$/,
    "Test DB name must end in _test",
  );
  process.env.DB_NAME = process.env.TEST_DB_NAME;
  process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters";
  const mysql = require("mysql2/promise");
  const setup = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  await setup.query(
    fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"),
  );
  await setup.query(
    fs.readFileSync(path.join(__dirname, "../../database/seed.sql"), "utf8"),
  );
  await setup.end();
  const app = require("../src/app"),
    pool = require("../src/db/pool");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(route, method = "GET", body, token) {
    const response = await fetch(base + route, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  }
  let admin, user, other;
  await t.test(
    "registration validates input and prevents duplicate email",
    async () => {
      assert.equal(
        (
          await request("/auth/register", "POST", {
            name: "Test",
            email: "bad",
            password: "short",
          })
        ).status,
        400,
      );
      const body = {
        name: "Test Student",
        email: "test@uni.edu",
        password: "Student@123",
      };
      const result = await request("/auth/register", "POST", body);
      assert.equal(result.status, 201);
      assert.equal(result.data.user.role, "user");
      assert.equal(result.data.user.password_hash, undefined);
      assert.equal((await request("/auth/register", "POST", body)).status, 409);
    },
  );
  await t.test("login and token authentication", async () => {
    assert.equal(
      (
        await request("/auth/login", "POST", {
          email: "admin@lab.edu",
          password: "wrong",
        })
      ).status,
      401,
    );
    admin = (
      await request("/auth/login", "POST", {
        email: "admin@lab.edu",
        password: "Admin@123",
      })
    ).data.token;
    user = (
      await request("/auth/login", "POST", {
        email: "arjun@uni.edu",
        password: "Student@123",
      })
    ).data.token;
    other = (
      await request("/auth/login", "POST", {
        email: "sara@uni.edu",
        password: "Student@123",
      })
    ).data.token;
    assert.ok(admin);
    assert.ok(user);
    assert.equal((await request("/auth/me")).status, 401);
    const me = await request("/auth/me", "GET", undefined, user);
    assert.equal(me.status, 200);
    assert.equal(me.data.password_hash, undefined);
    assert.equal((await request("/users", "GET", undefined, user)).status, 403);
  });
  let equipmentId, requestId;
  await t.test("equipment listing and admin-only creation", async () => {
    assert.equal(
      (await request("/equipment", "GET", undefined, user)).status,
      200,
    );
    const equipment = {
      equipment_code: "TEST-001",
      name: "Test instrument",
      description: "Integration test",
      category_id: 1,
      total_quantity: 2,
      location: "Test lab",
    };
    assert.equal(
      (await request("/equipment", "POST", equipment, user)).status,
      403,
    );
    const created = await request("/equipment", "POST", equipment, admin);
    assert.equal(created.status, 201);
    equipmentId = created.data.id;
    assert.equal(
      (await request("/equipment", "POST", equipment, admin)).status,
      409,
    );
    assert.equal(
      (
        await request(
          "/equipment",
          "POST",
          { ...equipment, equipment_code: "BAD", total_quantity: -1 },
          admin,
        )
      ).status,
      400,
    );
  });
  await t.test(
    "request approval checkout and return maintain stock and ownership",
    async () => {
      const body = {
        equipment_id: equipmentId,
        quantity: 2,
        expected_return_date: "2099-01-01",
      };
      assert.equal(
        (
          await request(
            "/borrow-requests",
            "POST",
            { ...body, quantity: 3 },
            user,
          )
        ).status,
        409,
      );
      const result = await request("/borrow-requests", "POST", body, user);
      assert.equal(result.status, 201);
      requestId = result.data.id;
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}`,
            "GET",
            undefined,
            other,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/approve`,
            "PATCH",
            {},
            user,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/approve`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .data.available_quantity,
        0,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/approve`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/borrow`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            other,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            user,
          )
        ).status,
        200,
      );
      assert.equal(
        (await request(`/borrow-requests/${requestId}`, "GET", undefined, user))
          .data.status,
        "RETURN_REQUESTED",
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .data.available_quantity,
        0,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            user,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${requestId}/return`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .data.available_quantity,
        2,
      );
    },
  );
  await t.test(
    "rejection and approved cancellation do not leak reservations",
    async () => {
      const body = {
        equipment_id: equipmentId,
        quantity: 1,
        expected_return_date: "2099-01-01",
      };
      const rejected = (await request("/borrow-requests", "POST", body, user))
        .data.id;
      assert.equal(
        (
          await request(
            `/borrow-requests/${rejected}/reject`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${rejected}/approve`,
            "PATCH",
            {},
            admin,
          )
        ).status,
        409,
      );
      const cancelled = (await request("/borrow-requests", "POST", body, user))
        .data.id;
      await request(
        `/borrow-requests/${cancelled}/approve`,
        "PATCH",
        {},
        admin,
      );
      assert.equal(
        (
          await request(
            `/borrow-requests/${cancelled}/cancel`,
            "PATCH",
            {},
            user,
          )
        ).status,
        200,
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .data.available_quantity,
        2,
      );
    },
  );
  await t.test("simultaneous approvals never oversell stock", async () => {
    const body = {
      equipment_id: equipmentId,
      quantity: 2,
      expected_return_date: "2099-01-01",
    };
    const first = (await request("/borrow-requests", "POST", body, user)).data
      .id;
    const second = (await request("/borrow-requests", "POST", body, other)).data
      .id;
    const results = await Promise.all([
      request(`/borrow-requests/${first}/approve`, "PATCH", {}, admin),
      request(`/borrow-requests/${second}/approve`, "PATCH", {}, admin),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const winner = results[0].status === 200 ? first : second;
    await request(`/borrow-requests/${winner}/cancel`, "PATCH", {}, admin);
    assert.equal(
      (await request(`/equipment/${equipmentId}`, "GET", undefined, user)).data
        .available_quantity,
      2,
    );
  });
  await t.test(
    "maintenance blocks borrowing and resolution restores eligibility",
    async () => {
      const report = await request(
        "/maintenance",
        "POST",
        { equipment_id: equipmentId, issue_description: "Faulty probe" },
        user,
      );
      assert.equal(report.status, 201);
      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}/status`,
            "PATCH",
            { status: "RESOLVED" },
            admin,
          )
        ).status,
        400,
      );

      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}`,
            "GET",
            undefined,
            other,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}/status`,
            "PATCH",
            { status: "IN_PROGRESS" },
            user,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}/status`,
            "PATCH",
            { status: "IN_PROGRESS" },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await request(
            "/borrow-requests",
            "POST",
            {
              equipment_id: equipmentId,
              quantity: 1,
              expected_return_date: "2099-01-01",
            },
            user,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/equipment/${equipmentId}/status`,
            "PATCH",
            { status: "AVAILABLE" },
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}/resolve`,
            "PATCH",
            { resolution: "Replaced probe" },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .data.status,
        "AVAILABLE",
      );
      assert.equal(
        (
          await request(
            `/maintenance/${report.data.id}/resolve`,
            "PATCH",
            { resolution: "Again" },
            admin,
          )
        ).status,
        409,
      );
    },
  );
  await t.test(
    "archival preserves history and dashboard is admin-only",
    async () => {
      assert.equal(
        (
          await request(
            `/equipment/${equipmentId}/status`,
            "PATCH",
            { status: "ARCHIVED" },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (await request(`/equipment/${equipmentId}`, "GET", undefined, user))
          .status,
        404,
      );
      assert.equal(
        (await request(`/borrow-requests/${requestId}`, "GET", undefined, user))
          .status,
        200,
      );
      assert.equal(
        (await request("/dashboard/stats", "GET", undefined, user)).status,
        403,
      );
      const stats = await request("/dashboard/stats", "GET", undefined, admin);
      assert.equal(stats.status, 200);
      assert.ok(stats.data.overdue_requests >= 1);
    },
  );
});
