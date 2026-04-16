const db = require('../config/db');

class StreamRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM media_events ORDER BY created_at DESC');
        return result.rows;
    }

    async create(streamData) {
        const result = await db.query(
            `INSERT INTO streams 
            (event_id, language, url, type, file_path, is_active, 
             chat_enabled, chat_moderated, polls_enabled, questions_enabled, comments_enabled) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *`,
            [
                streamData.eventId, streamData.language, streamData.url, streamData.type, streamData.filePath, true,
                streamData.chat_enabled, streamData.chat_moderated, streamData.polls_enabled, 
                streamData.questions_enabled, streamData.comments_enabled
            ]
        );
        return result.rows[0];
    }

    async update(id, streamData) {
        const result = await db.query(
            `UPDATE streams 
             SET language = $1, url = $2, type = $3, file_path = $4,
                 chat_enabled = $5, chat_moderated = $6, polls_enabled = $7, 
                 questions_enabled = $8, comments_enabled = $9
             WHERE id = $10 
             RETURNING *`,
            [
                streamData.language, streamData.url, streamData.type, streamData.filePath || null,
                streamData.chat_enabled, streamData.chat_moderated, streamData.polls_enabled, 
                streamData.questions_enabled, streamData.comments_enabled, id
            ]
        );
        return result.rows[0];
    }

    async delete(id) {
        await db.query('DELETE FROM streams WHERE id = $1', [id]);
    }

    async deleteByEventId(eventId) {
        await db.query('DELETE FROM streams WHERE event_id = $1', [eventId]);
    }

    async findByEventId(eventId) {
        const result = await db.query('SELECT * FROM streams WHERE event_id = $1', [eventId]);
        return result.rows;
    }
}

module.exports = StreamRepository;
