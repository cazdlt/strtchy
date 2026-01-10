#!/usr/bin/env node

import { db } from '../../src/lib/db/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from 'dotenv';

config();

async function run() {
    const args = process.argv.slice(2);
    const env = args[0] || 'dev';
    const dbUrl = env === 'prod' 
        ? process.env.DATABASE_URL || './data/prod/local.db'
        : process.env.DATABASE_URL || './data/dev/local.db';

    console.log(`Running database migrations... (${env})`);
    console.log(`Database: ${dbUrl}`);
    
    try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

run();
