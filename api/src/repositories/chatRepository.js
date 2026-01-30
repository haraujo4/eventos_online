const IChatRepository = require('../interfaces/IChatRepository');
const db = require('../config/db');
const ChatMapper = require('../mappings/ChatMapper');

class ChatRepository extends IChatRepository {
    async create(messageData) {
        const result = await db.query(
            'INSERT INTO messages (user_id, user_name, user_role, content) VALUES ($1, $2, $3, $4) RETURNING *',
            [messageData.userId, messageData.userName, messageData.userRole, messageData.content]
        );
        return ChatMapper.toDomain(result.rows[0]);
    }

    async findAll() {
        const result = await db.query('SELECT * FROM messages ORDER BY created_at ASC');
        return result.rows.map(row => ChatMapper.toDomain(row));
    }

    async findRecent(limit = 50) {
        const result = await db.query(
            'SELECT * FROM (SELECT * FROM messages WHERE is_deleted = false ORDER BY created_at DESC LIMIT $1) sub ORDER BY created_at ASC',
            [limit]
        );
        return result.rows.map(row => ChatMapper.toDomain(row));
    }

    async delete(id) {
        await db.query('UPDATE messages SET is_deleted = true WHERE id = $1', [id]);
        return true;
    }

    async countAll() {
        const result = await db.query('SELECT COUNT(*) FROM messages WHERE is_deleted = false');
        return parseInt(result.rows[0].count);
    }

    async toggleHighlight(id) {
        
        const current = await db.query('SELECT is_highlighted FROM messages WHERE id = $1', [id]);
        if (current.rows.length === 0) return null;

        const newState = !current.rows[0].is_highlighted;

        
        const result = await db.query(
            'UPDATE messages SET is_highlighted = $1 WHERE id = $2 RETURNING *',
            [newState, id]
        );
        return ChatMapper.toDomain(result.rows[0]);
    }
}

module.exports = ChatRepository;
