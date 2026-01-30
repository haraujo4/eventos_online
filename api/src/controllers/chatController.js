class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }

    async getHistory(req, res) {
        try {
            const messages = await this.chatService.getRecentMessages();
            res.json(messages);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.chatService.deleteMessage(id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async export(req, res) {
        try {
            const buffer = await this.chatService.exportChat();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=chat_history.xlsx');
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error exporting chat' });
        }
    }

    async banUser(req, res) {
        try {
            const { userId } = req.params;
            await this.chatService.banUser(userId);
            res.status(200).json({ message: 'User banned' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async unbanUser(req, res) {
        try {
            const { userId } = req.params;
            await this.chatService.unbanUser(userId);
            res.status(200).json({ message: 'User unbanned' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async toggleHighlight(req, res) {
        try {
            const { id } = req.params;
            const updated = await this.chatService.toggleHighlight(id);
            if (!updated) return res.status(404).json({ message: 'Message not found' });
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}


module.exports = ChatController;
