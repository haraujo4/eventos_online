const db = require('../src/config/db');

async function migrate() {
    console.log('--- MIGRATING FOR MIDIATECA ---');
    try {
        // 1. Adicionar colunas em event_settings
        await db.query(`ALTER TABLE event_settings ADD COLUMN IF NOT EXISTS midiateca_enabled BOOLEAN DEFAULT false`);
        await db.query(`ALTER TABLE event_settings ADD COLUMN IF NOT EXISTS midiateca_title VARCHAR(255) DEFAULT 'Midiateca'`);

        // 2. Adicionar colunas em streams (eventos)
        await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
        await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Geral'`);
        await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP`);
        await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`);
        await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS duration VARCHAR(20)`);
        
        // 3. Adicionar coluna em questions para o tempo do replay
        await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS replay_time INTEGER`); // segundos desde o início do vídeo

        console.log('--- MIDIATECA MIGRATION COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
