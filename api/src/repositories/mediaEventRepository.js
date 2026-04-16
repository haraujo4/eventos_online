const db = require('../config/db');

class MediaEventRepository {
    async findAll() {
        const result = await db.query(`
            SELECT e.*, 
            json_agg(s.*) as streams
            FROM media_events e
            LEFT JOIN streams s ON e.id = s.event_id
            GROUP BY e.id
            ORDER BY e.created_at DESC
        `);
        return result.rows;
    }

    async findById(id) {
        const result = await db.query(`
            SELECT e.*, 
            json_agg(s.*) as streams
            FROM media_events e
            LEFT JOIN streams s ON e.id = s.event_id
            WHERE e.id = $1
            GROUP BY e.id
        `, [id]);
        return result.rows[0];
    }

    async create(eventData) {
        const result = await db.query(
            `INSERT INTO media_events 
            (title, description, category, poster_url, is_featured, scheduled_at, 
             chat_enabled, chat_global, chat_moderated, polls_enabled, questions_enabled, comments_enabled, is_live) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`,
            [
                eventData.title, eventData.description, eventData.category, eventData.posterUrl, eventData.isFeatured, eventData.scheduledAt,
                eventData.chat_enabled ?? true, eventData.chat_global ?? true, eventData.chat_moderated ?? false,
                eventData.polls_enabled ?? true, eventData.questions_enabled ?? true, eventData.comments_enabled ?? true,
                eventData.is_live ?? false
            ]
        );
        return result.rows[0];
    }

    async update(id, eventData) {
        const result = await db.query(
            `UPDATE media_events 
            SET title = $1, description = $2, category = $3, poster_url = $4, is_featured = $5, scheduled_at = $6,
                chat_enabled = $7, chat_global = $8, chat_moderated = $9, polls_enabled = $10, questions_enabled = $11, comments_enabled = $12,
                is_live = $13
            WHERE id = $14 
            RETURNING *`,
            [
                eventData.title, eventData.description, eventData.category, eventData.posterUrl, eventData.isFeatured, eventData.scheduledAt,
                eventData.chat_enabled ?? true, eventData.chat_global ?? true, eventData.chat_moderated ?? false,
                eventData.polls_enabled ?? true, eventData.questions_enabled ?? true, eventData.comments_enabled ?? true,
                eventData.is_live ?? false,
                id
            ]
        );
        return result.rows[0];
    }

    async delete(id) {
        await db.query('DELETE FROM media_events WHERE id = $1', [id]);
    }

    async incrementViews(id) {
        await db.query('UPDATE media_events SET views = views + 1 WHERE id = $1', [id]);
    }

    async toggleLive(id, isLive) {
        const result = await db.query(
            'UPDATE media_events SET is_live = $1 WHERE id = $2 RETURNING *',
            [isLive, id]
        );
        return result.rows[0];
    }
}

module.exports = MediaEventRepository;
