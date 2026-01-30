const pollRepository = require('../repositories/pollRepository');

class PollController {
    constructor() {
        this.createPoll = this.createPoll.bind(this);
        this.vote = this.vote.bind(this);
        this.toggleStatus = this.toggleStatus.bind(this);
        this.getActivePoll = this.getActivePoll.bind(this);
        this.getAllPolls = this.getAllPolls.bind(this);
        this.deletePoll = this.deletePoll.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async createPoll(req, res) {
        try {
            const { question, options } = req.body;
            if (!question || !options || !options.length) {
                return res.status(400).json({ error: 'Question and options are required' });
            }

            const poll = await pollRepository.create(question, options);
            res.status(201).json(poll);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create poll' });
        }
    }

    async getActivePoll(req, res) {
        try {
            const poll = await pollRepository.getActive();
            if (!poll) return res.json(null);

            const userId = req.user.id;
            const userVote = await pollRepository.getUserVote(poll.id, userId);

            let results = null;
            if (poll.show_results) {
                results = await pollRepository.getResults(poll.id);
            }

            res.json({ ...poll, userVote, results });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch active poll' });
        }
    }

    async getAllPolls(req, res) {
        try {
            const polls = await pollRepository.getAll();
            res.json(polls);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch polls' });
        }
    }

    async vote(req, res) {
        try {
            const { pollId, optionId } = req.body;
            const userId = req.user.id;

            const existingVote = await pollRepository.getUserVote(pollId, userId);
            if (existingVote) {
                return res.status(400).json({ error: 'User already voted in this poll' });
            }

            await pollRepository.vote(pollId, userId, optionId);

            // If results are being shown, broadcast update
            const poll = await pollRepository.getById(pollId);
            if (poll.show_results && this.io) {
                const results = await pollRepository.getResults(pollId);
                this.io.emit('poll:results', { pollId, results });
            }

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to vote' });
        }
    }

    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active, show_results } = req.body;

            if (is_active) {
                await pollRepository.deactivateAll();
            }

            const updatedPoll = await pollRepository.updateStatus(id, is_active, show_results);

            if (this.io) {
                if (is_active) {
                    const fullPoll = await pollRepository.getById(id);
                    this.io.emit('poll:new', fullPoll);
                } else {
                    this.io.emit('poll:closed', { id });
                }

                if (show_results) {
                    const results = await pollRepository.getResults(id);
                    this.io.emit('poll:results', { pollId: id, results });
                }
            }

            res.json(updatedPoll);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update poll status' });
        }
    }

    async deletePoll(req, res) {
        try {
            const { id } = req.params;
            await pollRepository.delete(id);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete poll' });
        }
    }
}

module.exports = new PollController();
