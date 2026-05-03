#!/usr/bin/env node

import { config } from "dotenv";

// Ensure env is loaded before importing db
config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set. Run via npm run db:setup or set it manually.");
  process.exit(1);
}

console.log(`[Seed] Target: ${process.env.DATABASE_URL}`);

import { seedDatabase } from "../../src/lib/seed/index.js";

async function run() {
  console.log("Seeding database...");
  try {
    await seedDatabase();
    console.log("✅ Seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

run();
