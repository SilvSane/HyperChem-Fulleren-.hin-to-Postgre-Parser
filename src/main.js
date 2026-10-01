import fs from "node:fs";
import { ensureDatabase, printConnectionHelp } from "./db/ensure.js";
import { ParseHin } from "./db/insert.js";
import { askFilePath, askTableName } from "./cli/prompts.js";

console.log("hin -> PostgreSQL");
console.log("Press Ctrl+C at any time to abort.");
console.log("");

try {
  await ensureDatabase();
} catch (err) {
  printConnectionHelp(err);
  process.exit(1);
}

const filePath = await askFilePath();
const stat = fs.statSync(filePath);
console.log(`Found: ${filePath}`);
console.log(`Size:  ${stat.size} bytes`);
console.log("");

while (true) {
  const tableName = await askTableName();
  try {
    await ParseHin(filePath, tableName);
    break;
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    console.log("Try another table name, or press Ctrl+C to abort.");
    console.log("");
  }
}
