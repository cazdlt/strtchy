#!/usr/bin/env node
/**
 * Migration Generator Script
 *
 * Workaround for drizzle-kit generate bug (TypeError: Cannot read properties of undefined (reading 'length'))
 *
 * Usage:
 *   npm run db:generate        # Generate migration for dev database
 *   npm run db:generate:prod   # Generate migration for prod database
 *
 * This script:
 * 1. Uses drizzle-kit export to get current schema SQL
 * 2. Creates a migration file with the SQL
 * 3. Updates the migration journal
 */

import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";
import { join, basename } from "path";
import { config } from "dotenv";

config();

const args = process.argv.slice(2);
const env = args[0] || "dev";
const dbUrl =
  env === "prod"
    ? process.env.DATABASE_URL || "./data/prod/local.db"
    : process.env.DATABASE_URL || "./data/dev/local.db";

const outDir = "./drizzle";
const migrationsDir = join(outDir, "migrations");
const metaDir = join(outDir, "meta");

// Ensure migrations directory exists
if (!existsSync(migrationsDir)) {
  mkdirSync(migrationsDir, { recursive: true });
}

function getMigrationId() {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, "").split(".")[0];
  const random = Math.random().toString(36).substring(2, 8);
  return `${dateStr}_${random}`;
}

function getCurrentMigrations() {
  if (!existsSync(metaDir)) return [];
  const journalPath = join(metaDir, "_journal.json");
  if (!existsSync(journalPath)) return [];

  const journal = JSON.parse(readFileSync(journalPath, "utf-8"));
  return journal.entries || [];
}

function updateJournal(migrationId, sqlContent) {
  const journalPath = join(metaDir, "_journal.json");
  let journal = { version: "5", dialect: "sqlite", entries: [] };

  if (existsSync(journalPath)) {
    try {
      journal = JSON.parse(readFileSync(journalPath, "utf-8"));
    } catch (e) {
      // Use default
    }
  }

  journal.entries = journal.entries || [];

  // Check if migration already exists
  if (journal.entries.find((e: any) => e.id === migrationId)) {
    console.log(`Migration ${migrationId} already exists`);
    return false;
  }

  journal.entries.push({
    idx: journal.entries.length,
    version: "5",
    when: Date.now(),
    tag: migrationId,
    breakpoints: [true],
  });

  writeFileSync(journalPath, JSON.stringify(journal, null, 2) + "\n");
  return true;
}

function generateMigration() {
  const migrationId = getMigrationId();
  console.log(`Generating migration: ${migrationId}`);
  console.log(`Database: ${dbUrl}`);

  // Export current schema SQL
  console.log("Exporting schema from database...");
  let sql;
  try {
    const output = execSync(`DATABASE_URL="${dbUrl}" npx drizzle-kit export`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    sql = output;
  } catch (error) {
    console.error("Failed to export schema:", error);
    process.exit(1);
  }

  if (!sql || sql.trim() === "") {
    console.log("No schema changes detected");
    return;
  }

  // Create migration file
  const migrationFile = join(migrationsDir, `${migrationId}.sql`);
  writeFileSync(migrationFile, sql);
  console.log(`Created migration file: ${migrationFile}`);

  // Update journal
  if (updateJournal(migrationId, sql)) {
    console.log("Updated migration journal");
  }

  console.log("✅ Migration generated successfully");
}

generateMigration();
