const db = require('./src/config/db');

async function migrate() {
    console.log('--- STARTING MIGRATION: RESOURCE CONTROLS ---');
    try {
        // 1. Adicionar colunas em media_events
        console.log('Updating media_events table...');
        await db.query(`
            ALTER TABLE media_events 
            ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS chat_global BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS chat_moderated BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS polls_enabled BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS questions_enabled BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;
        `);

        // 2. Adicionar colunas em streams
        console.log('Updating streams table...');
        await db.query(`
            ALTER TABLE streams 
            ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN,
            ADD COLUMN IF NOT EXISTS chat_moderated BOOLEAN,
            ADD COLUMN IF NOT EXISTS polls_enabled BOOLEAN,
            ADD COLUMN IF NOT EXISTS questions_enabled BOOLEAN,
            ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN;
        `);

        // 3. Adicionar event_id em recursos
        console.log('Updating resource tables...');
        await db.query(`
            ALTER TABLE polls ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES media_events(id) ON DELETE CASCADE;
            ALTER TABLE questions ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES media_events(id) ON DELETE CASCADE;
            ALTER TABLE comments ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES media_events(id) ON DELETE CASCADE;
        `);

        console.log('--- MIGRATION COMPLETED SUCCESSFULY ---');
        process.exit(0);
    } catch (err) {
        console.error('Error during migration:', err);
        process.exit(1);
    }
}

migrate();
