const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Starting migration: add stream_id to polls table...');

        // Add stream_id column if it doesn't exist
        await db.query(`
            ALTER TABLE polls 
            ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
