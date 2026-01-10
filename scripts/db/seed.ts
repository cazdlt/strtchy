#!/usr/bin/env node

import { seedDatabase } from '../../src/lib/seed/index.js';

async function run() {
    console.log('Seeding database...');
    try {
        await seedDatabase();
        console.log('✅ Seed completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

run();
