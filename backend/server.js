require("dotenv").config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters");
const app = require("./src/app");
const pool = require("./src/db/pool");
const server = app.listen(Number(process.env.PORT || 5000), () =>
  console.log("API listening on port " + (process.env.PORT || 5000)),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
