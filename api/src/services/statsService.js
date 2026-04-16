const db = require('../config/db');

class StatsService {
    constructor(userRepository, streamRepository, chatRepository) {
        this.userRepository = userRepository;
        this.streamRepository = streamRepository;
        this.chatRepository = chatRepository;
    }

    async getDashboardStats(eventId = null) {
        const users = await this.userRepository.findAll();
        
        // Filter streams by event if provided
        let streams = await this.streamRepository.findAll();
        if (eventId) {
            streams = streams.filter(s => s.event_id == eventId);
        }

        const totalUsers = users.length;
        const totalStreams = streams.length;
        const activeStreams = streams.filter(s => s.is_featured).length;
        
        // Count messages (filter by event if provided)
        let totalMessagesQuery = 'SELECT COUNT(*) FROM messages WHERE is_deleted = false';
        const params = [];
        if (eventId) {
            totalMessagesQuery += ' AND stream_id IN (SELECT id FROM streams WHERE event_id = $1)';
            params.push(eventId);
        }
        const totalMessagesRes = await db.query(totalMessagesQuery, params);
        const totalMessages = parseInt(totalMessagesRes.rows[0].count);

        // Fetch Reactions
        let reactionsQuery = 'SELECT type FROM stream_reactions';
        if (eventId) {
            reactionsQuery += ' WHERE stream_id IN (SELECT id FROM streams WHERE event_id = $1)';
        }
        const reactionsRes = await db.query(reactionsQuery, params);
        const totalLikes = reactionsRes.rows.filter(r => r.type === 'like').length;
        const totalDislikes = reactionsRes.rows.filter(r => r.type === 'dislike').length;

        // Fetch Poll Votes
        let pollVotesQuery = 'SELECT COUNT(*) FROM poll_votes';
        if (eventId) {
            pollVotesQuery = 'SELECT COUNT(*) FROM poll_votes pv JOIN polls p ON pv.poll_id = p.id WHERE p.event_id = $1';
        }
        const pollVotesRes = await db.query(pollVotesQuery, params);
        const totalPollVotes = parseInt(pollVotesRes.rows[0].count);

        // Fetch Pending (Moderation)
        let pendingMessagesQuery = 'SELECT COUNT(*) FROM messages WHERE is_approved = false AND is_deleted = false';
        if (eventId) {
            pendingMessagesQuery += ' AND stream_id IN (SELECT id FROM streams WHERE event_id = $1)';
        }
        const pendingMessagesRes = await db.query(pendingMessagesQuery, params);
        
        let pendingCommentsQuery = 'SELECT COUNT(*) FROM comments WHERE is_approved = false';
        if (eventId) {
            pendingCommentsQuery += ' AND event_id = $1';
        }
        const pendingCommentsRes = await db.query(pendingCommentsQuery, params);

        // Fetch recent messages formatted
        const recentMessages = await this.chatRepository.findRecent(null, true, 5, true); // Get all then filter
        const filteredMessages = eventId 
            ? recentMessages.filter(m => m.eventTitle === (streams[0]?.event_title || '')) 
            : recentMessages;

        // Fetch recent sessions (User Joins)
        let sessionQuery = `
            SELECT sl.entry_time, u.name 
            FROM session_logs sl
            JOIN users u ON sl.user_id = u.id
        `;
        if (eventId) {
            sessionQuery += ' WHERE sl.stream_id IN (SELECT id FROM streams WHERE event_id = $1)';
        }
        sessionQuery += ' ORDER BY sl.entry_time DESC LIMIT 5';
        const recentSessionsResult = await db.query(sessionQuery, params);

        const recentActivity = [
            ...filteredMessages.map(msg => ({
                id: `msg-${msg.id}`,
                action: `Usuário ${msg.userName} enviou uma mensagem`,
                time: msg.createdAt,
                type: 'message'
            })),
            ...recentSessionsResult.rows.map((session, idx) => ({
                id: `sess-${idx}`,
                action: `Usuário ${session.name} entrou na transmissão`,
                time: session.entry_time,
                type: 'system'
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        return {
            totalUsers,
            totalStreams,
            activeStreams,
            totalMessages,
            totalLikes,
            totalDislikes,
            totalPollVotes,
            pendingModeration: parseInt(pendingMessagesRes.rows[0].count) + parseInt(pendingCommentsRes.rows[0].count),
            recentActivity
        };
    }
}

module.exports = StatsService;
