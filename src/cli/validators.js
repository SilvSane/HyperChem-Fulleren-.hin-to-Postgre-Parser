const RESERVED = new Set([
  "select",
  "insert",
  "update",
  "delete",
  "drop",
  "table",
  "where",
  "from",
  "order",
  "group",
  "by",
  "user",
  "role",
  "session",
  "index",
  "view",
  "primary",
  "foreign",
]);

/**
 * @param {string} raw - full path
 * @returns {true | string} true on success, error message on failure
 */
export function validateTableName(raw) {
  if (typeof raw !== "string") return "must be a string";
  const name = raw.trim();
  if (!name) return "cannot be empty";
  if (name.length > 63) return "max 63 characters";
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    return "letters, digits and _ only; cannot start with a digit";
  }
  if (RESERVED.has(name.toLowerCase())) return "reserved SQL keyword";
  return true;
}
