import fs from "node:fs";
import path from "node:path";
import inquirer from "inquirer";
import { validateTableName } from "./validators.js";

function normalize(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return path.resolve(s);
}

export async function askFilePath() {
  const { filePath } = await inquirer.prompt([
    {
      type: "input",
      name: "filePath",
      message: "Path to .hin file:",
      filter: normalize,
      validate: (input) => {
        const resolved = normalize(input);
        if (!resolved) return "path cannot be empty";
        if (!fs.existsSync(resolved)) return `not found: ${resolved}`;
        if (!fs.statSync(resolved).isFile()) return `not a file: ${resolved}`;
        if (!resolved.toLowerCase().endsWith(".hin"))
          return "expected a .hin file";
        return true;
      },
    },
  ]);
  return filePath;
}

export async function askTableName() {
  const { tableName } = await inquirer.prompt([
    {
      type: "input",
      name: "tableName",
      message: "PostgreSQL table name:",
      validate: validateTableName,
    },
  ]);
  return tableName;
}
