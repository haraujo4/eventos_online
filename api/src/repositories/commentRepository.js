const db = require('../config/db');

class CommentRepository {
    async create(userId, streamId, content) {
        const query = `
            INSERT INTO comments (user_id, stream_id, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await db.query(query, [userId, streamId, content]);
        return result.rows[0];
    }

    async getApproved(streamId) {
        const query = `
            SELECT c.*, u.name as user_name,
                (SELECT json_agg(json_build_object('type', r.type, 'count', sub.cnt))
                 FROM (SELECT type, count(*) as cnt FROM comment_reactions WHERE comment_id = c.id GROUP BY type) sub
                 JOIN (SELECT DISTINCT type FROM comment_reactions WHERE comment_id = c.id) r ON r.type = sub.type
                ) as reactions
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.stream_id = $1 AND c.is_approved = true
            ORDER BY c.created_at ASC;
        `;
        // Optimized reaction fetch might be needed later if it gets slow
        const result = await db.query(query, [streamId]);
        return result.rows;
    }

    async getAllPending() {
        const query = `
            SELECT c.*, u.name as user_name, u.email as user_email, s.title as stream_title
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN streams s ON c.stream_id = s.id
            WHERE c.is_approved = false
            ORDER BY c.created_at DESC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async getAllApproved() {
        const query = `
            SELECT c.*, u.name as user_name, u.email as user_email, s.title as stream_title
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN streams s ON c.stream_id = s.id
            WHERE c.is_approved = true
            ORDER BY c.created_at DESC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async approve(id) {
        const query = 'UPDATE comments SET is_approved = true WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async delete(id) {
        await db.query('DELETE FROM comments WHERE id = $1', [id]);
    }

    async addReaction(userId, commentId, type) {
        const query = `
            INSERT INTO comment_reactions (user_id, comment_id, type)
            VALUES ($1, $2, $3)
            ON CONFLICT (comment_id, user_id)
            DO UPDATE SET type = EXCLUDED.type
            RETURNING *;
        `;
        const result = await db.query(query, [userId, commentId, type]);
        return result.rows[0];
    }

    async getCommentReactions(commentId) {
        const query = `
            SELECT type, COUNT(*)::int as count
            FROM comment_reactions
            WHERE comment_id = $1
            GROUP BY type;
        `;
        const result = await db.query(query, [commentId]);
        return result.rows;
    }
}

module.exports = new CommentRepository();
