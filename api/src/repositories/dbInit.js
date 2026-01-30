const db = require('../config/db');

const createTables = async () => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const streamsTable = `
    CREATE TABLE IF NOT EXISTS streams (
      id SERIAL PRIMARY KEY,
      language VARCHAR(50) NOT NULL,
      url TEXT,
      poster_url TEXT,
      is_active BOOLEAN DEFAULT true,
      file_path TEXT, -- For MinIO file path if uploaded
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const settingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(50) PRIMARY KEY,
          value JSONB
      );
  `;

  const messagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(255), -- Denormalized for simpler queries
      user_role VARCHAR(50),  -- Denormalized
      content TEXT NOT NULL,
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(usersTable);
    await db.query(streamsTable);
    await db.query(settingsTable);
    await db.query(messagesTable);
    await db.query(messagesTable);

    // Explicitly create stream_reactions table
    await db.query(`
        CREATE TABLE IF NOT EXISTS stream_reactions (
            id SERIAL PRIMARY KEY,
            stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) CHECK (type IN ('like', 'dislike')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(stream_id, user_id)
        )
    `);


    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
    } catch (e) {
      console.log('Migration note: status column might already exist or error ignored', e.message);
    }


    try {
      await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'direct'`);
    } catch (e) {
      console.log('Migration note: type column might already exist or error ignored', e.message);
    }


    try {
      await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS title VARCHAR(255)`);
      await db.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS description TEXT`);
    } catch (e) {
      console.log('Migration note: title/description columns might already exist or error ignored', e.message);
    }


    try {

      await db.query(`
            CREATE TABLE IF NOT EXISTS event_settings (
                id SERIAL PRIMARY KEY,
                event_name VARCHAR(255) DEFAULT 'Corporate Event 2026',
                logo_url TEXT,
                primary_color VARCHAR(50) DEFAULT '#2563eb',
                auth_mode VARCHAR(50) DEFAULT 'standard',
                allow_registration BOOLEAN DEFAULT true,
                two_factor_enabled BOOLEAN DEFAULT false,
                smtp_config JSONB DEFAULT '{}'::jsonb,
                background_url TEXT,
                polls_enabled BOOLEAN DEFAULT true,
                comments_enabled BOOLEAN DEFAULT true,
                questions_enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

      // Polls
      await db.query(`
            CREATE TABLE IF NOT EXISTS polls (
                id SERIAL PRIMARY KEY,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                is_active BOOLEAN DEFAULT false,
                show_results BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
      try {
        await db.query(`ALTER TABLE polls ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE`);
      } catch (e) {
        console.log('Migration note: stream_id column in polls might already exist', e.message);
      }
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

      // Comments
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

      // Questions
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

      const settingsCount = await db.query('SELECT COUNT(*) FROM event_settings');
      if (parseInt(settingsCount.rows[0].count) === 0) {
        await db.query("INSERT INTO event_settings (event_name) VALUES ('Corporate Event 2026')");
      }


      await db.query(`
            CREATE TABLE IF NOT EXISTS auth_fields (
        id SERIAL PRIMARY KEY,
        field_name VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        input_type VARCHAR(50) DEFAULT 'text',
        is_required BOOLEAN DEFAULT false,
        options JSONB,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
        `);


      await db.query(`
            CREATE TABLE IF NOT EXISTS analytics(
          id SERIAL PRIMARY KEY,
          active_viewers INTEGER DEFAULT 0,
          path VARCHAR(255),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);


      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}':: jsonb`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_2fa_code VARCHAR(10)`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_2fa_expires TIMESTAMP`);


      await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false`);


      await db.query(`ALTER TABLE auth_fields ADD COLUMN IF NOT EXISTS mask VARCHAR(100)`);
      await db.query(`ALTER TABLE auth_fields ADD COLUMN IF NOT EXISTS placeholder VARCHAR(255)`);



    } catch (e) {
      console.log('Migration note: Event Config tables/columns might already exist or error ignored', e.message);
    }

    console.log('Tables created successfully');


    const adminCheck = await db.query('SELECT * FROM users WHERE email = $1', ['admin@test.com']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin', 10);
      await db.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@test.com', hashedPassword, 'Admin User', 'admin']
      );
      console.log('Admin user seeded');
    }


    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', ['user@test.com']);
    if (userCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('user', 10);
      await db.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['user@test.com', hashedPassword, 'Regular User', 'user']
      );
      console.log('Regular user seeded');
    }
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

module.exports = { createTables };
