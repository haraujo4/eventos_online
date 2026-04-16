const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- CRIANDO TABELA DE ANALYTICS (SESSION_LOGS) ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        socket_id TEXT,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        ip_address TEXT,
        user_agent TEXT
      )
    `);
    console.log('--- TABELA CRIADA COM SUCESSO ---');
  } catch (err) {
    console.error('Erro ao criar tabela de analytics:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
