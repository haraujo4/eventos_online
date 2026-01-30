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

        
        const recentActivity = recentMessages.reverse().map(msg => ({
            id: msg.id,
            action: `User ${msg.userName} sent a message`,
            time: msg.createdAt,
            type: 'message'
        }));

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
