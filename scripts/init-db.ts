#!/usr/bin/env node

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../src/lib/db/index.js';
import { seedDatabase } from '../src/lib/seed/index.js';

async function init() {
	console.log('Initializing database...');
	
	try {
		// Skip migrations - using drizzle-kit push instead
		
		// Seed data
		await seedDatabase();
		
		console.log('\n🎉 Database initialized successfully!');
		process.exit(0);
	} catch (error) {
		console.error('Error initializing database:', error);
		process.exit(1);
	}
}

init();
