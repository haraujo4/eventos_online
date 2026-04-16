const db = require('../config/db');

class EventRepository {
    async getSettings() {
        const result = await db.query('SELECT * FROM event_settings LIMIT 1');
        return result.rows[0];
    }

    async updateSettings(data) {
        // Buscar configurações atuais para merge
        const current = await this.getSettings();
        
        const result = await db.query(
            `UPDATE event_settings SET 
                event_name = $1,
                auth_mode = $2,
                two_factor_enabled = $3,
                allow_registration = $4,
                chat_enabled = $5,
                chat_moderated = $6,
                chat_global = $7,
                polls_enabled = $8,
                comments_enabled = $9,
                questions_enabled = $10,
                smtp_config = $11,
                midiateca_enabled = $12,
                is_live = $13
            RETURNING *`,
            [
                data.event_name !== undefined ? data.event_name : current.event_name,
                data.auth_mode !== undefined ? data.auth_mode : current.auth_mode,
                data.two_factor_enabled !== undefined ? data.two_factor_enabled : current.two_factor_enabled,
                data.allow_registration !== undefined ? data.allow_registration : current.allow_registration,
                data.chat_enabled !== undefined ? data.chat_enabled : current.chat_enabled,
                data.chat_moderated !== undefined ? data.chat_moderated : current.chat_moderated,
                data.chat_global !== undefined ? data.chat_global : current.chat_global,
                data.polls_enabled !== undefined ? data.polls_enabled : current.polls_enabled,
                data.comments_enabled !== undefined ? data.comments_enabled : current.comments_enabled,
                data.questions_enabled !== undefined ? data.questions_enabled : current.questions_enabled,
                data.smtp_config !== undefined ? (typeof data.smtp_config === 'string' ? data.smtp_config : JSON.stringify(data.smtp_config)) : current.smtp_config,
                data.midiateca_enabled !== undefined ? data.midiateca_enabled : current.midiateca_enabled,
                data.is_live !== undefined ? data.is_live : current.is_live
            ]
        );
        return result.rows[0];
    }

    async uploadLogo(logoUrl) {
        const result = await db.query(
            'UPDATE event_settings SET logo_url = $1 RETURNING *',
            [logoUrl]
        );
        return result.rows[0];
    }

    async uploadBackground(backgroundUrl) {
        const result = await db.query(
            'UPDATE event_settings SET background_url = $1 RETURNING *',
            [backgroundUrl]
        );
        return result.rows[0];
    }

    async removeBackground() {
        const result = await db.query('UPDATE event_settings SET background_url = NULL RETURNING *');
        return result.rows[0];
    }

    async resetEvent() {
        await db.query('BEGIN');
        try {
            await db.query('DELETE FROM messages');
            await db.query('DELETE FROM questions');
            await db.query('DELETE FROM comments');
            await db.query('DELETE FROM stream_reactions');
            await db.query('DELETE FROM poll_votes');
            await db.query('DELETE FROM poll_options');
            await db.query('DELETE FROM polls');
            await db.query("DELETE FROM session_logs WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')");
            await db.query("DELETE FROM users WHERE role != 'admin'");
            await db.query('COMMIT');
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    }

    async getAuthFields() {
        const result = await db.query('SELECT * FROM auth_fields ORDER BY display_order ASC');
        return result.rows;
    }

    async updateAuthFields(fields) {
        await db.query('DELETE FROM auth_fields');
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            await db.query(
                `INSERT INTO auth_fields (field_name, label, input_type, is_required, options, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    field.field_name, 
                    field.label, 
                    field.input_type || 'text', 
                    field.is_required || false, 
                    field.options ? (typeof field.options === 'string' ? field.options : JSON.stringify(field.options)) : null,
                    i
                ]
            );
        }
    }
}

module.exports = new EventRepository();
