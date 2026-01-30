const IChatRepository = require('../interfaces/IChatRepository');
const db = require('../config/db');
const ChatMapper = require('../mappings/ChatMapper');

class ChatRepository extends IChatRepository {
    async create(messageData) {
        const { userId, userName, userRole, content, streamId, isApproved } = messageData;
        const result = await db.query(
            'INSERT INTO messages (user_id, user_name, user_role, content, stream_id, is_approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, userName, userRole, content, streamId, isApproved !== undefined ? isApproved : true]
        );
        return ChatMapper.toDomain(result.rows[0]);
    }

    async findAll() {
        const result = await db.query('SELECT * FROM messages ORDER BY created_at ASC');
        return result.rows.map(row => ChatMapper.toDomain(row));
    }

    async findRecent(streamId, isGlobal = false, limit = 50, includeAllStreams = false) {
        let query = `
            SELECT m.*, s.title as stream_title, s.language as stream_language 
            FROM messages m 
            LEFT JOIN streams s ON m.stream_id = s.id 
            WHERE m.is_deleted = false AND m.is_approved = true
        `;
        const params = [];


        if (includeAllStreams) {
            // Admin Mode: Fetch everything
        } else if (!isGlobal) {
            // Room Mode: Strict filtering
            if (streamId) {
                query += ' AND m.stream_id = $1';
                params.push(streamId);
            } else {
                query += ' AND 1=0';
            }
        }

        query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(`SELECT * FROM (${query}) sub ORDER BY created_at ASC`, params);
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

    async findPending() {
        const query = `
            SELECT m.*, s.title as stream_title, s.language as stream_language 
            FROM messages m 
            LEFT JOIN streams s ON m.stream_id = s.id 
            WHERE m.is_deleted = false AND m.is_approved = false 
            ORDER BY m.created_at ASC
        `;
        const result = await db.query(query);
        return result.rows.map(row => ChatMapper.toDomain(row));
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

    async approve(id) {
        const result = await db.query(
            'UPDATE messages SET is_approved = true WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) return null;
        return ChatMapper.toDomain(result.rows[0]);
    }
}

module.exports = ChatRepository;
