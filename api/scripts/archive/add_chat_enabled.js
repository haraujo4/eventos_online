const db = require('../src/config/db');

async function migrate() {
    try {
        console.log('Adding chat_enabled column to event_settings...');
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_settings' AND column_name='chat_enabled') THEN 
                    ALTER TABLE event_settings ADD COLUMN chat_enabled BOOLEAN DEFAULT TRUE; 
                END IF; 
            END $$;
        `);
        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
