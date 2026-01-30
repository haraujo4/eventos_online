const db = require('../config/db');

class ReactionRepository {
    async addOrUpdateReaction(userId, streamId, type) {
        const query = `
            INSERT INTO stream_reactions (user_id, stream_id, type)
            VALUES ($1, $2, $3)
            ON CONFLICT (stream_id, user_id)
            DO UPDATE SET type = EXCLUDED.type
            RETURNING *;
        `;
        const result = await db.query(query, [userId, streamId, type]);
        return result.rows[0];
    }

    async removeReaction(userId, streamId) {
        const query = `
            DELETE FROM stream_reactions
            WHERE user_id = $1 AND stream_id = $2
            RETURNING *;
        `;
        const result = await db.query(query, [userId, streamId]);
        return result.rows[0];
    }

    async getReactionsCount(streamId) {
        const query = `
            SELECT 
                SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as likes,
                SUM(CASE WHEN type = 'dislike' THEN 1 ELSE 0 END) as dislikes
            FROM stream_reactions
            WHERE stream_id = $1;
        `;
        const result = await db.query(query, [streamId]);
        return {
            likes: parseInt(result.rows[0].likes || 0),
            dislikes: parseInt(result.rows[0].dislikes || 0)
        };
    }

    async getUserReaction(userId, streamId) {
        const query = `
            SELECT type FROM stream_reactions
            WHERE user_id = $1 AND stream_id = $2;
        `;
        const result = await db.query(query, [userId, streamId]);
        return result.rows[0] ? result.rows[0].type : null;
    }

    async getReactionsReport() {
        const query = `
            SELECT 
                r.id,
                r.type,
                r.created_at,
                u.name as user_name,
                u.email as user_email,
                s.title as stream_title,
                s.language as stream_language
            FROM stream_reactions r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN streams s ON r.stream_id = s.id
            ORDER BY r.created_at DESC;
        `;
        const result = await db.query(query);
        return result.rows;
    }
}

module.exports = new ReactionRepository();
