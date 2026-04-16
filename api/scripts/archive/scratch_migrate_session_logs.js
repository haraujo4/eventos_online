const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding stream_id to session_logs...');
        await db.query('ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id);');
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
