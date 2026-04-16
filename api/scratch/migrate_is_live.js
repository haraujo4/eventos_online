const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function migrate() {
  try {
    await pool.query('ALTER TABLE media_events ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;');
    console.log('Migration successful: is_live column added.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
