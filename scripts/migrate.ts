#!/usr/bin/env node

import { db } from '../src/lib/db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

async function run() {
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('Migration complete');
	process.exit(0);
}

run().catch(err => {
	console.error(err);
	process.exit(1);
});
