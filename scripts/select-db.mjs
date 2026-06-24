#!/usr/bin/env node
// Rewrites the datasource `provider` in prisma/schema.prisma so the same schema
// can target Postgres (production / Neon) or SQLite (DEMO_MODE).
//
//   node scripts/select-db.mjs sqlite     # demo (local file db)
//   node scripts/select-db.mjs postgres   # production
//
// The schema body is written in the cross-compatible subset, so only the
// provider line changes.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

const arg = (process.argv[2] || "").toLowerCase();
const provider = arg === "sqlite" ? "sqlite" : arg === "postgres" || arg === "postgresql" ? "postgresql" : null;

if (!provider) {
  console.error("Usage: node scripts/select-db.mjs <sqlite|postgres>");
  process.exit(1);
}

let schema = readFileSync(schemaPath, "utf8");
const before = schema;
schema = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"[^"]+"/,
  `$1"${provider}"`
);

if (schema === before && !schema.includes(`provider = "${provider}"`)) {
  console.error("Could not rewrite datasource provider — check schema.prisma format.");
  process.exit(1);
}

writeFileSync(schemaPath, schema);
console.log(`✓ schema.prisma datasource provider set to "${provider}"`);
