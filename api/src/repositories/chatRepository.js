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

    async findAll(eventId = null) {
        let query = `
            SELECT 
                m.*, 
                u.email as user_email,
                s.language as stream_language,
                e.title as event_title
            FROM messages m
            JOIN users u ON m.user_id = u.id
            JOIN streams s ON m.stream_id = s.id
            JOIN media_events e ON s.event_id = e.id
        `;
        const params = [];

        if (eventId) {
            query += ` WHERE s.event_id = $1`;
            params.push(eventId);
        }

        query += ` ORDER BY m.created_at ASC`;
        const result = await db.query(query, params);
        return result.rows.map(row => ChatMapper.toDomain(row));
    }

    async findRecent(streamId, isGlobal = false, limit = 50, includeAllStreams = false, requesterId = null) {
        let query = `
            SELECT 
                m.id, m.user_id, m.user_name, m.user_role, m.content, 
                m.is_deleted, m.created_at, m.is_highlighted, m.stream_id, m.is_approved,
                s.language as stream_language, e.title as event_title
            FROM messages m 
            JOIN streams s ON m.stream_id = s.id 
            JOIN media_events e ON s.event_id = e.id
            WHERE m.is_deleted = false
        `;
        const params = [];

        // Visibility Logic:
        // 1. If Admin, see everything
        // 2. If Auth user, see approved OR own pending
        // 3. If Guest, see only approved
        if (includeAllStreams) {
            // Admin sees everything (no is_approved check)
        } else if (requesterId) {
            query += ` AND (m.is_approved = true OR m.user_id = $${params.length + 1})`;
            params.push(requesterId);
        } else {
            query += ` AND m.is_approved = true`;
        }


        if (includeAllStreams) {
            // Admin Mode: Fetch everything OR filter by event
            if (streamId) { 
                 query += ` AND m.stream_id IN (SELECT id FROM streams WHERE event_id = $${params.length + 1})`;
                 params.push(streamId);
            }
        } else {
            // Se tivermos um ID de stream, vamos filtrar pelo EVENTO desse stream
            if (streamId) {
                if (isGlobal) {
                    query += ` AND m.stream_id IN (SELECT id FROM streams WHERE event_id = (SELECT event_id FROM streams WHERE id = $${params.length + 1}))`;
                } else {
                    query += ` AND m.stream_id = $${params.length + 1}`;
                }
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

    async findPending(eventId = null) {
        let query = `
            SELECT 
                m.id, m.user_id, m.user_name, m.user_role, m.content, 
                m.is_deleted, m.created_at, m.is_highlighted, m.stream_id, m.is_approved,
                s.language as stream_language, e.title as event_title
            FROM messages m 
            JOIN streams s ON m.stream_id = s.id 
            JOIN media_events e ON s.event_id = e.id
            WHERE m.is_deleted = false AND m.is_approved = false 
        `;
        const params = [];

        if (eventId) {
            query += ` AND s.event_id = $1`;
            params.push(eventId);
        }

        query += ` ORDER BY m.created_at ASC`;
        const result = await db.query(query, params);
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
