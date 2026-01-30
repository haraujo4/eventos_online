const questionRepository = require('../repositories/questionRepository');

class QuestionController {
    constructor() {
        this.addQuestion = this.addQuestion.bind(this);
        this.getQuestions = this.getQuestions.bind(this);
        this.displayQuestion = this.displayQuestion.bind(this);
        this.deleteQuestion = this.deleteQuestion.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async addQuestion(req, res) {
        try {
            const { streamId, content } = req.body;
            const userId = req.user.id;

            if (!content) return res.status(400).json({ error: 'Content is required' });

            const question = await questionRepository.create(userId, streamId, content);

            if (this.io) {
                this.io.emit('question:new', question);
            }

            res.status(201).json({ message: 'Question submitted', question });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to submit question' });
        }
    }

    async getQuestions(req, res) {
        try {
            const questions = await questionRepository.getAll();
            res.json(questions);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch questions' });
        }
    }

    async displayQuestion(req, res) {
        try {
            const { id } = req.params;
            const { isGlobal } = req.body;
            const question = await questionRepository.markAsDisplayed(id);

            // Broadcast to players for 15s display
            if (this.io) {
                // Fetch full question data for display
                const allQuestions = await questionRepository.getAll();
                const fullQuestion = allQuestions.find(q => q.id === parseInt(id));

                if (fullQuestion) {
                    this.io.emit('question:display', {
                        user_name: fullQuestion.user_name,
                        content: fullQuestion.content,
                        duration: 15000,
                        streamId: isGlobal ? null : (fullQuestion.stream_id ? Number(fullQuestion.stream_id) : null)
                    });
                }
            }

            res.json(question);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to display question' });
        }
    }

    async deleteQuestion(req, res) {
        try {
            const { id } = req.params;
            await questionRepository.delete(id);
            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete question' });
        }
    }
}

module.exports = new QuestionController();
