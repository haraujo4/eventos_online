const IStreamRepository = require('../interfaces/IStreamRepository');
const db = require('../config/db');
const StreamMapper = require('../mappings/StreamMapper');

class StreamRepository extends IStreamRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM streams ORDER BY language ASC');
        return result.rows.map(row => StreamMapper.toDomain(row));
    }

    async findById(id) {
        const result = await db.query('SELECT * FROM streams WHERE id = $1', [id]);
        return StreamMapper.toDomain(result.rows[0]);
    }

    async create(streamData) {
        const result = await db.query(
            'INSERT INTO streams (language, url, poster_url, is_active, file_path, type, title, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [streamData.language, streamData.url, streamData.posterUrl, true, streamData.filePath, streamData.type, streamData.title, streamData.description]
        );
        return StreamMapper.toDomain(result.rows[0]);
    }

    async update(id, streamData) {
        
        const fields = [];
        const values = [];
        let idx = 1;

        if (streamData.language) { fields.push(`language = $${idx++}`); values.push(streamData.language); }
        if (streamData.url !== undefined) { fields.push(`url = $${idx++}`); values.push(streamData.url); }
        if (streamData.posterUrl !== undefined) { fields.push(`poster_url = $${idx++}`); values.push(streamData.posterUrl); }
        if (streamData.filePath !== undefined) { fields.push(`file_path = $${idx++}`); values.push(streamData.filePath); }
        if (streamData.type !== undefined) { fields.push(`type = $${idx++}`); values.push(streamData.type); }
        if (streamData.title !== undefined) { fields.push(`title = $${idx++}`); values.push(streamData.title); }
        if (streamData.description !== undefined) { fields.push(`description = $${idx++}`); values.push(streamData.description); }

        if (fields.length === 0) return null;

        values.push(id);
        const result = await db.query(
            `UPDATE streams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        return StreamMapper.toDomain(result.rows[0]);
    }

    async delete(id) {
        await db.query('DELETE FROM streams WHERE id = $1', [id]);
        return true;
    }

    
    async getSetting(key) {
        const result = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            return result.rows[0].value;
        }
        return null; 
    }

    async setSetting(key, value) {
        
        const result = await db.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2
             RETURNING value`,
            [key, value] 
        );
        return result.rows[0].value;
    }
}

module.exports = StreamRepository;
