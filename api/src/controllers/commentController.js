const commentRepository = require('../repositories/commentRepository');

class CommentController {
    constructor() {
        this.addComment = this.addComment.bind(this);
        this.getComments = this.getComments.bind(this);
        this.getPendingComments = this.getPendingComments.bind(this);
        this.approveComment = this.approveComment.bind(this);
        this.deleteComment = this.deleteComment.bind(this);
        this.reactToComment = this.reactToComment.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async addComment(req, res) {
        try {
            const { streamId, content } = req.body;
            const userId = req.user.id;

            if (!content) return res.status(400).json({ error: 'Content is required' });

            const comment = await commentRepository.create(userId, streamId, content);

            // Notify admins/moderators that a new comment is pending
            if (this.io) {
                this.io.emit('comment:pending', comment);
            }

            res.status(201).json({ message: 'Comment submitted for moderation', comment });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    }

    async getComments(req, res) {
        try {
            const { streamId } = req.params;
            const comments = await commentRepository.getApproved(streamId);
            res.json(comments);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    }

    async getPendingComments(req, res) {
        try {
            const comments = await commentRepository.getAllPending();
            res.json(comments);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch pending comments' });
        }
    }

    async approveComment(req, res) {
        try {
            const { id } = req.params;
            const comment = await commentRepository.approve(id);

            // Broadcast the new approved comment to all players
            if (this.io) {
                // Fetch full comment data with user info for broadcasting
                const fullComments = await commentRepository.getApproved(comment.stream_id);
                const approvedComment = fullComments.find(c => c.id === parseInt(id));
                this.io.emit('comment:new', approvedComment);
            }

            res.json(comment);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to approve comment' });
        }
    }

    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            await commentRepository.delete(id);

            if (this.io) {
                this.io.emit('comment:deleted', { id });
            }

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    }

    async reactToComment(req, res) {
        try {
            const { commentId, type } = req.body;
            const userId = req.user.id;

            if (!['happy', 'funny', 'love', 'sad', 'angry'].includes(type)) {
                return res.status(400).json({ error: 'Invalid reaction type' });
            }

            await commentRepository.addReaction(userId, commentId, type);
            const reactions = await commentRepository.getCommentReactions(commentId);

            if (this.io) {
                this.io.emit('comment:reaction', { commentId, reactions });
            }

            res.json({ success: true, reactions });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to react to comment' });
        }
    }
}

module.exports = new CommentController();
