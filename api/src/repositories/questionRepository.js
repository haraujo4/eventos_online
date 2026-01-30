const db = require('../config/db');

class QuestionRepository {
    async create(userId, streamId, content) {
        const query = `
            INSERT INTO questions (user_id, stream_id, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await db.query(query, [userId, streamId, content]);
        return result.rows[0];
    }

    async getAll() {
        const query = `
            SELECT q.*, u.name as user_name, u.email as user_email
            FROM questions q
            JOIN users u ON q.user_id = u.id
            ORDER BY q.created_at DESC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    async markAsDisplayed(id) {
        const query = 'UPDATE questions SET displayed_at = NOW() WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async delete(id) {
        await db.query('DELETE FROM questions WHERE id = $1', [id]);
    }
}

module.exports = new QuestionRepository();
