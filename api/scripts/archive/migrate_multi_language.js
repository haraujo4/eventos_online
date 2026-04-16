const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- INICIANDO MIGRAÇÃO PARA MULTI-IDIOMA ---');
    await client.query('BEGIN');

    // 1. Criar a tabela de Eventos
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Geral',
        poster_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Modificar a tabela de streams para linkar com eventos
    // Primeiro verificamos se a coluna event_id já existe
    const hasEventId = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'streams' AND column_name = 'event_id'
    `);

    if (hasEventId.rowCount === 0) {
      await client.query('ALTER TABLE streams ADD COLUMN event_id INTEGER REFERENCES media_events(id) ON DELETE CASCADE');
    }

    // 3. Migrar dados existentes (Se houver títulos nas streams, criamos um evento para cada uma)
    const existingStreams = await client.query('SELECT * FROM streams WHERE event_id IS NULL');
    console.log(`Migrando ${existingStreams.rowCount} streams existentes para novos eventos...`);

    for (const stream of existingStreams.rows) {
      const eventRes = await client.query(
        'INSERT INTO media_events (title, description, category, poster_url, is_featured, scheduled_at, views, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [stream.title || 'Evento Importado', stream.description, stream.category, stream.poster_url, stream.is_featured, stream.scheduled_at, stream.views, stream.created_at]
      );
      
      const eventId = eventRes.rows[0].id;
      await client.query('UPDATE streams SET event_id = $1 WHERE id = $2', [eventId, stream.id]);
    }

    await client.query('COMMIT');
    console.log('--- MIGRAÇÃO CONCLUÍDA COM SUCESSO ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro na migração:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
