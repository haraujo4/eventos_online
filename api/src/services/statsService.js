const db = require('../config/db');

class StatsService {
    constructor(userRepository, streamRepository, chatRepository) {
        this.userRepository = userRepository;
        this.streamRepository = streamRepository;
        this.chatRepository = chatRepository;
    }

    async getDashboardStats() {
        const users = await this.userRepository.findAll();
        const streams = await this.streamRepository.findAll();
        const recentMessages = await this.chatRepository.findRecent(5);

        const totalUsers = users.length;
        const totalStreams = streams.length;
        const activeStreams = streams.filter(s => s.isActive).length;
        const totalMessages = await this.chatRepository.countAll();

        // Fetch recent sessions (User Joins)
        const recentSessionsResult = await db.query(`
            SELECT sl.entry_time, u.name 
            FROM session_logs sl
            JOIN users u ON sl.user_id = u.id
            ORDER BY sl.entry_time DESC
            LIMIT 5
        `);

        // Format Messages
        const messageActivity = recentMessages.map(msg => ({
            id: `msg-${msg.id}`,
            action: `Usuário ${msg.userName} enviou uma mensagem`,
            time: msg.createdAt,
            type: 'message'
        }));

        // Format Sessions
        const sessionActivity = recentSessionsResult.rows.map((session, idx) => ({
            id: `sess-${idx}`,
            action: `Usuário ${session.name} entrou na transmissão`,
            time: session.entry_time,
            type: 'system' // or 'join'
        }));

        // Merge and Sort
        const recentActivity = [...messageActivity, ...sessionActivity]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);

        return {
            totalUsers,
            totalStreams,
            activeStreams,
            totalMessages,
            recentActivity,
            reports: 0
        };
    }
}

module.exports = StatsService;
