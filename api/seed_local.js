const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function seed() {
    console.log('--- SEEDING DATABASE ---');
    try {
        // 1. Inserir Streams de exemplo
        const streamsCheck = await db.query('SELECT COUNT(*) FROM streams');
        if (parseInt(streamsCheck.rows[0].count) === 0) {
            console.log('Inserting sample streams...');
            await db.query(`
                INSERT INTO streams (language, url, title, description, type, is_active) 
                VALUES 
                ('pt-br', 'https://www.youtube.com/embed/5qap5aO4i9A', 'Palestra de Abertura', 'Bem-vindos ao evento de 2026!', 'youtube', true),
                ('en', 'https://www.youtube.com/embed/5qap5aO4i9A', 'Opening Keynote', 'Welcome to the 2026 event!', 'youtube', true)
            `);
        }

        // 2. Inserir Campos de Autenticação (Auth Fields)
        const fieldsCheck = await db.query('SELECT COUNT(*) FROM auth_fields');
        if (parseInt(fieldsCheck.rows[0].count) === 0) {
            console.log('Inserting authentication fields...');
            await db.query(`
                INSERT INTO auth_fields (field_name, label, input_type, is_required, display_order)
                VALUES 
                ('name', 'Nome Completo', 'text', true, 1),
                ('company', 'Empresa', 'text', true, 2),
                ('position', 'Cargo', 'text', false, 3)
            `);
        }

        console.log('--- SEEDING COMPLETED SUCCESSFULY ---');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
}

seed();
