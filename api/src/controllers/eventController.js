const db = require('../config/db');
const minioService = require('../services/minioService');

class EventController {
    constructor() {
        this.io = null;
        this.getSettings = this.getSettings.bind(this);
        this.updateSettings = this.updateSettings.bind(this);
        this.updateAuthFields = this.updateAuthFields.bind(this);
        this.uploadLogo = this.uploadLogo.bind(this);
        this.uploadBackground = this.uploadBackground.bind(this);
        this.removeBackground = this.removeBackground.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async getSettings(req, res) {
        try {
            const settingsResult = await db.query('SELECT * FROM event_settings LIMIT 1');
            const settings = settingsResult.rows[0] || {};
            const authFieldsResult = await db.query('SELECT * FROM auth_fields ORDER BY display_order ASC');

            res.json({
                settings,
                authFields: authFieldsResult.rows
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching settings' });
        }
    }

    async updateSettings(req, res) {
        try {
            const updates = req.body;

            // Get current settings to merge
            const currentRes = await db.query('SELECT * FROM event_settings LIMIT 1');
            const current = currentRes.rows[0] || {};

            const merged = { ...current, ...updates };

            const query = `
                UPDATE event_settings 
                SET event_name = $1, auth_mode = $2, two_factor_enabled = $3, 
                    smtp_config = $4, allow_registration = $5, chat_enabled = $6,
                    polls_enabled = $7, comments_enabled = $8, questions_enabled = $9,
                    updated_at = NOW()
                WHERE id = $10
                RETURNING *
            `;

            const result = await db.query(query, [
                merged.event_name, merged.auth_mode, merged.two_factor_enabled,
                merged.smtp_config, merged.allow_registration, merged.chat_enabled,
                merged.polls_enabled, merged.comments_enabled, merged.questions_enabled,
                merged.id
            ]);

            const updatedSettings = result.rows[0];

            if (this.io) {
                console.log('Broadcasting settings update:', updatedSettings);
                this.io.emit('settings:update', updatedSettings);
            }

            res.json(updatedSettings);
        } catch (err) {
            console.error('Error updating settings:', err);
            res.status(500).json({ message: 'Error updating settings' });
        }
    }

    async updateAuthFields(req, res) {
        try {
            const { fields } = req.body;
            await db.query('BEGIN');
            await db.query('DELETE FROM auth_fields');

            if (fields && fields.length > 0) {
                for (const field of fields) {
                    await db.query(
                        'INSERT INTO auth_fields (field_name, label, input_type, is_required, options, display_order, mask, placeholder) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                        [field.field_name, field.label, field.input_type, field.is_required, JSON.stringify(field.options), field.display_order, field.mask, field.placeholder]
                    );
                }
            }

            await db.query('COMMIT');
            res.json({ message: 'Auth fields updated' });
        } catch (err) {
            await db.query('ROLLBACK');
            console.error(err);
            res.status(500).json({ message: 'Error updating auth fields' });
        }
    }

    async uploadLogo(req, res) {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const filename = `logo-${Date.now()}-${req.file.originalname}`;
            const logoUrl = await minioService.uploadImage(filename, req.file.buffer, req.file.mimetype);

            const result = await db.query('UPDATE event_settings SET logo_url = $1 RETURNING *', [logoUrl]);
            const updated = result.rows[0];

            if (this.io) this.io.emit('settings:update', updated);

            res.json({ logoUrl });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error uploading logo' });
        }
    }

    async uploadBackground(req, res) {
        try {
            if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

            const filename = `bg-${Date.now()}-${req.file.originalname}`;
            const backgroundUrl = await minioService.uploadImage(filename, req.file.buffer, req.file.mimetype);

            const result = await db.query('UPDATE event_settings SET background_url = $1 RETURNING *', [backgroundUrl]);
            const updated = result.rows[0];

            if (this.io) this.io.emit('settings:update', updated);

            res.json({ backgroundUrl });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error uploading background' });
        }
    }

    async removeBackground(req, res) {
        try {
            const result = await db.query('UPDATE event_settings SET background_url = NULL RETURNING *');
            const updated = result.rows[0];

            if (this.io) this.io.emit('settings:update', updated);

            res.json({ message: 'Background removed' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error removing background' });
        }
    }
}

module.exports = new EventController();
