const db = require('./src/config/db');

async function run() {
    try {
        console.log('Starting migration for advanced features...');

        // 1. Update event_settings with feature flags
        await db.query(`
            ALTER TABLE event_settings 
            ADD COLUMN IF NOT EXISTS polls_enabled BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS questions_enabled BOOLEAN DEFAULT true
        `);
        console.log('Feature flags added to event_settings.');

        // 2. Polls
        await db.query(`
            CREATE TABLE IF NOT EXISTS polls (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                is_active BOOLEAN DEFAULT false,
                show_results BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS poll_options (
                id SERIAL PRIMARY KEY,
                poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
                option_text TEXT NOT NULL
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS poll_votes (
                id SERIAL PRIMARY KEY,
                poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(poll_id, user_id)
            )
        `);
        console.log('Poll tables created.');

        // 3. Comments
        await db.query(`
             CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_approved BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS comment_reactions (
                id SERIAL PRIMARY KEY,
                comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(20) CHECK (type IN ('happy', 'funny', 'love', 'sad', 'angry')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(comment_id, user_id)
            )
        `);
        console.log('Comment tables created.');

        // 4. Questions
        await db.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                displayed_at TIMESTAMP
            )
        `);
        console.log('Questions table created.');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

run();
