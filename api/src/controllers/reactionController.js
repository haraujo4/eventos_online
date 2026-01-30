const reactionRepository = require('../repositories/reactionRepository');

class ReactionController {

    constructor() {
        this.addOrUpdateReaction = this.addOrUpdateReaction.bind(this);
        this.removeReaction = this.removeReaction.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async addOrUpdateReaction(req, res) {
        try {
            const { streamId, type } = req.body;
            const userId = req.user.id;

            if (!streamId) {
                return res.status(400).json({ error: 'Stream ID is required' });
            }

            if (!['like', 'dislike'].includes(type)) {
                return res.status(400).json({ error: 'Invalid reaction type. Must be like or dislike.' });
            }

            const updatedReaction = await reactionRepository.addOrUpdateReaction(userId, streamId, type);
            const stats = await reactionRepository.getReactionsCount(streamId);

            if (this.io) {
                this.io.emit('reaction:update', { streamId, stats });
            }

            res.status(200).json({
                success: true,
                reaction: updatedReaction,
                stats: stats
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add reaction' });
        }
    }

    async removeReaction(req, res) {
        try {
            const { streamId } = req.body;
            const userId = req.user.id;

            await reactionRepository.removeReaction(userId, streamId);
            const stats = await reactionRepository.getReactionsCount(streamId);

            if (this.io) {
                this.io.emit('reaction:update', { streamId, stats });
            }

            res.status(200).json({
                success: true,
                stats: stats
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to remove reaction' });
        }
    }

    async getStats(req, res) {
        try {
            const { streamId } = req.params;
            const userId = req.user ? req.user.id : null;

            const stats = await reactionRepository.getReactionsCount(streamId);

            let userReaction = null;
            if (userId) {
                userReaction = await reactionRepository.getUserReaction(userId, streamId);
            }

            res.status(200).json({
                stats: stats,
                userReaction: userReaction
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch reaction stats' });
        }
    }

    async getReport(req, res) {
        try {
            // Admin check should be middleware, but simple check here
            if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const report = await reactionRepository.getReactionsReport();
            res.status(200).json(report);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch reaction report' });
        }
    }
}

module.exports = new ReactionController();
