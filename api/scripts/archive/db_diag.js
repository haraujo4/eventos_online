const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'session_logs'");
    console.log('COLUNAS_LIDAS:', res.rows.map(r => r.column_name));
    
    // Se não houver entry_time, vamos forçar a renomeação agora mesmo
    if (!res.rows.find(r => r.column_name === 'entry_time')) {
       console.log('Tentando renomear colunas para o padrão do código...');
       await pool.query("ALTER TABLE session_logs RENAME COLUMN start_time TO entry_time");
       await pool.query("ALTER TABLE session_logs RENAME COLUMN end_time TO exit_time");
       console.log('Renomeação forçada concluída!');
    }
  } catch (err) {
    console.error('Erro no diagnóstico:', err.message);
  } finally {
    await pool.end();
  }
}

check();
