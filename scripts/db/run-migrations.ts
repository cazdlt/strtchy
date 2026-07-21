#!/usr/bin/env node
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const NC = "\x1b[0m";

const dbPath = process.env.DATABASE_URL || "./local.db";

console.log(`${GREEN}[DB] Connecting to: ${dbPath}${NC}`);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Create migrations tracking table if it doesn't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    created_at INTEGER
  )
`);

// Read journal
const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
let journal;
try {
  journal = JSON.parse(readFileSync(journalPath, "utf-8"));
} catch (e) {
  console.error(`${RED}❌ Error reading journal at ${journalPath}${NC}`);
  process.exit(1);
}

const appliedMigrations = sqlite
  .prepare("SELECT hash FROM __drizzle_migrations")
  .all()
  .map((row: any) => row.hash);

let applied = 0;
let skipped = 0;

for (const entry of journal.entries) {
  if (appliedMigrations.includes(entry.tag)) {
    console.log(`${YELLOW}[Skip] ${entry.tag} - already applied${NC}`);
    skipped++;
    continue;
  }

  const migrationPath = join(process.cwd(), "drizzle", `${entry.tag}.sql`);
  let sql: string;
  try {
    sql = readFileSync(migrationPath, "utf-8");
  } catch (e) {
    console.error(`${RED}❌ Error reading migration at ${migrationPath}${NC}`);
    process.exit(1);
  }

  // --- Special handling: baseline migration (0000) ---
  if (entry.tag === "0000_nervous_slipstream") {
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'")
      .get();
    if (tableExists) {
      console.log(
        `${YELLOW}[Skip] ${entry.tag} - tables already exist (baseline)${NC}`
      );
      sqlite
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
        .run(entry.tag, Date.now());
      skipped++;
      continue;
    }
  }

  // --- Special handling: practice_data migration (0001) ---
  if (entry.tag === "0001_update_practice_data") {
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'practice_data'")
      .get();
    if (!tableExists) {
      console.log(
        `${YELLOW}[Skip] ${entry.tag} - practice_data table does not exist yet (will be created by baseline)${NC}`
      );
      sqlite
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
        .run(entry.tag, Date.now());
      skipped++;
      continue;
    }

    const oldCol = sqlite
      .prepare(
        "SELECT name FROM pragma_table_info('practice_data') WHERE name = 'routine_movement_id'"
      )
      .get();
    if (!oldCol) {
      console.log(
        `${YELLOW}[Skip] ${entry.tag} - already on new schema (no routine_movement_id column)${NC}`
      );
      sqlite
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
        .run(entry.tag, Date.now());
      skipped++;
      continue;
    }
  }

  // --- Run migration ---
  console.log(`${GREEN}[Apply] ${entry.tag}...${NC}`);

  // Split by Drizzle's statement breakpoint and execute each non-empty statement
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length === 0) return false;
      // Check if there's any non-comment, non-whitespace content
      const hasRealContent = s
        .split("\n")
        .some((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith("--");
        });
      return hasRealContent;
    });

  try {
    const transaction = sqlite.transaction(() => {
      for (const stmt of statements) {
        sqlite.exec(stmt);
      }
    });
    transaction();

    sqlite
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run(entry.tag, Date.now());

    console.log(`${GREEN}[OK] ${entry.tag} applied${NC}`);
    applied++;
  } catch (err) {
    console.error(`${RED}❌ Failed to apply ${entry.tag}:${NC}`);
    console.error(err);
    process.exit(1);
  }
}

console.log(
  `${GREEN}✅ Migrations complete: ${applied} applied, ${skipped} skipped${NC}`
);
