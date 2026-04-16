const db = require('../src/config/db');

async function setup() {
    console.log('🚀 Iniciando configuração unificada do banco de dados...');
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Tabela de Usuários
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Tabela de Eventos (Mídias)
        await client.query(`
            CREATE TABLE IF NOT EXISTS media_events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100) DEFAULT 'Geral',
                poster_url TEXT,
                is_featured BOOLEAN DEFAULT false,
                scheduled_at TIMESTAMP,
                is_live BOOLEAN DEFAULT false,
                chat_enabled BOOLEAN DEFAULT true,
                chat_global BOOLEAN DEFAULT true,
                chat_moderated BOOLEAN DEFAULT false,
                polls_enabled BOOLEAN DEFAULT true,
                questions_enabled BOOLEAN DEFAULT true,
                comments_enabled BOOLEAN DEFAULT true,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Tabela de Streams (Idiomas/Links)
        await client.query(`
            CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES media_events(id) ON DELETE CASCADE,
                language VARCHAR(50) NOT NULL,
                url TEXT,
                type VARCHAR(50) DEFAULT 'youtube',
                file_path TEXT,
                is_active BOOLEAN DEFAULT true,
                chat_enabled BOOLEAN DEFAULT true,
                chat_moderated BOOLEAN DEFAULT false,
                polls_enabled BOOLEAN DEFAULT true,
                questions_enabled BOOLEAN DEFAULT true,
                comments_enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Tabela de Mensagens do Chat
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_approved BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Tabela de Perguntas
        await client.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                is_answered BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Tabelas de Enquetes
        await client.query(`
            CREATE TABLE IF NOT EXISTS polls (
                id SERIAL PRIMARY KEY,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS poll_options (
                id SERIAL PRIMARY KEY,
                poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
                option_text TEXT NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS poll_votes (
                id SERIAL PRIMARY KEY,
                poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
                option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(poll_id, user_id)
            )
        `);

        // 7. Tabela de Reações (Likes/Dislikes)
        await client.query(`
            CREATE TABLE IF NOT EXISTS reactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL, -- 'like' ou 'dislike'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, stream_id)
            )
        `);

        // 8. Tabela de Logs de Sessão (Analytics)
        await client.query(`
            CREATE TABLE IF NOT EXISTS session_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL,
                entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                exit_time TIMESTAMP
            )
        `);

        // 9. Tabela de Configurações Globais
        await client.query(`
            CREATE TABLE IF NOT EXISTS event_settings (
                id SERIAL PRIMARY KEY,
                event_name VARCHAR(255) DEFAULT 'Meu Evento Online',
                logo_url TEXT,
                background_url TEXT,
                primary_color VARCHAR(50) DEFAULT '#2563eb',
                secondary_color VARCHAR(50) DEFAULT '#1e40af',
                midiateca_enabled BOOLEAN DEFAULT true,
                auth_mode VARCHAR(50) DEFAULT 'email',
                two_factor_enabled BOOLEAN DEFAULT false,
                allow_registration BOOLEAN DEFAULT true,
                chat_enabled BOOLEAN DEFAULT true,
                chat_moderated BOOLEAN DEFAULT false,
                chat_global BOOLEAN DEFAULT true,
                polls_enabled BOOLEAN DEFAULT true,
                comments_enabled BOOLEAN DEFAULT true,
                questions_enabled BOOLEAN DEFAULT true,
                smtp_config TEXT,
                is_live BOOLEAN DEFAULT false,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 10. Tabela de Campos de Autenticação
        await client.query(`
            CREATE TABLE IF NOT EXISTS auth_fields (
                id SERIAL PRIMARY KEY,
                field_name VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                input_type VARCHAR(50) DEFAULT 'text',
                is_required BOOLEAN DEFAULT false,
                options TEXT, -- JSON string
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ---- MIGRAÇÕES DE COLUNAS (Segurança Adicional) ----
        
        // Colunas essenciais na event_settings que podem faltar
        const settingsCols = [
            'two_factor_enabled', 'allow_registration', 'chat_enabled', 
            'chat_moderated', 'chat_global', 'polls_enabled', 
            'comments_enabled', 'questions_enabled', 'smtp_config'
        ];
        for (const col of settingsCols) {
            await client.query(`ALTER TABLE event_settings ADD COLUMN IF NOT EXISTS ${col} ${col === 'smtp_config' ? 'TEXT' : 'BOOLEAN DEFAULT true'}`);
        }

        // Adicionar colunas na streams
        const streamCols = ['is_active', 'chat_enabled', 'chat_moderated', 'polls_enabled', 'questions_enabled', 'comments_enabled'];
        for (const col of streamCols) {
            await client.query(`ALTER TABLE streams ADD COLUMN IF NOT EXISTS ${col} BOOLEAN DEFAULT true`);
        }

        // Adicionar stream_id na session_logs
        await client.query('ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL');

        // Adicionar is_featured na media_events
        await client.query('ALTER TABLE media_events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false');

        // 11. Inserir Configurações Padrão se não existirem
        const settingsCheck = await client.query('SELECT id FROM event_settings LIMIT 1');
        if (settingsCheck.rows.length === 0) {
            console.log('📝 Inserindo configurações iniciais padrão...');
            await client.query(`
                INSERT INTO event_settings (event_name, midiateca_enabled, auth_mode, is_live)
                VALUES ('Eventos Online', true, 'email', false)
            `);
        }

        await client.query('COMMIT');
        console.log('✅ Banco de dados configurado com sucesso!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao configurar banco de dados:', err);
    } finally {
        client.release();
        process.exit();
    }
}

setup();
