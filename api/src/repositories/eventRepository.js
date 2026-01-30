const db = require('../config/db');

class EventRepository {
    async getSettings() {
        const result = await db.query('SELECT * FROM event_settings LIMIT 1');
        return result.rows[0];
    }

    async updateSettings(data) {
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
                smtp_config = $11
            RETURNING *`,
            [
                data.event_name,
                data.auth_mode,
                data.two_factor_enabled,
                data.allow_registration,
                data.chat_enabled,
                data.chat_moderated,
                data.chat_global,
                data.polls_enabled,
                data.comments_enabled,
                data.questions_enabled,
                data.smtp_config
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
            // Delete order matters due to FK constraints
            // 1. Delete Interactions
            await db.query('DELETE FROM messages');
            await db.query('DELETE FROM questions');
            await db.query('DELETE FROM comments');
            await db.query('DELETE FROM stream_reactions');

            // 2. Delete Polls (Votes and Options cascade usually, but let's be thorough)
            await db.query('DELETE FROM poll_votes');
            await db.query('DELETE FROM poll_options');
            await db.query('DELETE FROM polls');

            // 3. Delete Session Logs (references users)
            await db.query("DELETE FROM session_logs WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')");

            // 4. Delete Users (Except Admins)
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
                `INSERT INTO auth_fields (field_name, field_type, required, display_order) VALUES ($1, $2, $3, $4)`,
                [field.field_name, field.field_type, field.required, i]
            );
        }
    }
}

module.exports = new EventRepository();
