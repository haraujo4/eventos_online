const db = require('../config/db');
const minioService = require('../services/minioService');

const eventController = {
    
    getSettings: async (req, res) => {
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
    },

    
    updateSettings: async (req, res) => {
        try {
            const { event_name, auth_mode, two_factor_enabled, smtp_config, allow_registration, chat_enabled } = req.body;

            const query = `
        UPDATE event_settings 
        SET event_name = $1, auth_mode = $2, two_factor_enabled = $3, smtp_config = $4, allow_registration = $5, chat_enabled = $6, updated_at = NOW()
        WHERE id = (SELECT id FROM event_settings LIMIT 1)
        RETURNING *
      `;

            const result = await db.query(query, [event_name, auth_mode, two_factor_enabled, smtp_config, allow_registration, chat_enabled]);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error updating settings' });
        }
    },

    
    updateAuthFields: async (req, res) => {
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
    },

    uploadLogo: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            
            const filename = `logo-${Date.now()}-${req.file.originalname}`;
            const logoUrl = await minioService.uploadImage(filename, req.file.buffer, req.file.mimetype);

            await db.query('UPDATE event_settings SET logo_url = $1', [logoUrl]);
            res.json({ logoUrl });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error uploading logo' });
        }
    }
};

module.exports = eventController;
