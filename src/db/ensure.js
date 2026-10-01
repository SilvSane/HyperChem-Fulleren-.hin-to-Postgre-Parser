import fs from "node:fs";
import { Client } from "pg";
import conf from "../config/dbConfig.js";

const HINTS = {
  ECONNREFUSED: "server is not running, or wrong host/port",
  ENOTFOUND: "host not found",
  ETIMEDOUT: "connection timed out",
  "28P01": "invalid password for user",
  28000: "invalid authorization",
  "3D000": "database does not exist",
  42501: "insufficient privilege (need CREATEDB or superuser)",
};

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

async function tryConnect(cfg) {
  const client = new Client(cfg);
  try {
    await client.connect();
    return client;
  } catch (err) {
    await client.end().catch(() => {});
    throw err;
  }
}

export async function ensureDatabase() {
  const target = conf.dbC.database;

  try {
    const c = await tryConnect(conf.dbC);
    await c.end();
    return;
  } catch (err) {
    if (err.code !== "3D000") throw err;
  }

  const admin = await tryConnect({ ...conf.dbC, database: "postgres" });
  try {
    const { rows } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [target],
    );
    if (rows.length === 0) {
      console.log(`Database ${target} not found, creating...`);
      await admin.query(`CREATE DATABASE ${quoteIdent(target)}`);
      console.log(`Created database ${target}.`);
    }
  } finally {
    await admin.end();
  }

  const c = await tryConnect(conf.dbC);
  await c.end();
}

export function printConnectionHelp(err) {
  const code = err.code ?? "unknown";
  const hint = HINTS[code] ?? "unknown error";

  console.error("");
  console.error("No connection to PostgreSQL.");
  console.error(`  code: ${code}`);
  console.error(`  hint: ${hint}`);
  console.error("");

  console.error("Check your .env file. Format from .env.example:");
  try {
    const example = fs.readFileSync(".env.example", "utf8").trimEnd();
    for (const line of example.split("\n")) console.error(`  ${line}`);
  } catch {
    console.error("  (could not read .env.example)");
  }
  console.error("");

  console.error("To make Postgres match, run in psql:");
  console.error("  CREATE USER <DB_USER> WITH PASSWORD '<DB_PASSWORD>';");
  console.error("  CREATE DATABASE <DB_DATABASE> OWNER <DB_USER>;");
  console.error(
    "  GRANT ALL PRIVILEGES ON DATABASE <DB_DATABASE> TO <DB_USER>;",
  );
  console.error("");
}
