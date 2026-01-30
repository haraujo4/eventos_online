const ChatMapper = require('../mappings/ChatMapper');
const { CreateMessageDTO } = require('../dtos/ChatDTOs');
const db = require('../config/db');

class ChatService {
    constructor(chatRepository, userRepository, io) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.io = io;
    }

    async getRecentMessages(streamId, isAdmin = false) {
        const settingsRes = await db.query('SELECT chat_global FROM event_settings LIMIT 1');
        const isGlobal = settingsRes.rows[0]?.chat_global;

        // If admin, includeAllStreams = true
        const messages = await this.chatRepository.findRecent(streamId, isGlobal, 50, isAdmin);
        return messages.map(msg => ChatMapper.toDTO(msg));
    }

    async getPendingMessages() {
        const messages = await this.chatRepository.findPending();
        return messages.map(msg => ChatMapper.toDTO(msg));
    }

    async saveAndBroadcast(userId, userName, userRole, content) {


    }

    async exportChat() {
        const messages = await this.chatRepository.findAll();
        const xlsx = require('xlsx');

        const data = messages.map(msg => ({
            ID: msg.id,
            Date: msg.createdAt,
            User: msg.userName,
            Role: msg.userRole,
            Content: msg.content,
            Highlighted: msg.isHighlighted ? 'Yes' : 'No',
            Deleted: msg.isDeleted ? 'Yes' : 'No'
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Chat History');

        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    async saveAndBroadcast(userId, userName, userRole, content, streamId) {

        const user = await this.userRepository.findById(userId);
        if (user && user.status === 'banned') {
            throw new Error('You are banned from the chat.');
        }


        const settingsRes = await db.query('SELECT chat_moderated, chat_global FROM event_settings LIMIT 1');
        const settings = settingsRes.rows[0] || {};
        const isModerated = settings.chat_moderated;
        const isGlobal = settings.chat_global; // This should be boolean
        const isAdmin = userRole === 'admin' || userRole === 'moderator';

        console.log('Chat Debug:', { isModerated, isGlobal, streamId, content, userRole });

        if (!content || content.trim() === '') return null;

        // If Global Chat is enabled, we treat it as streamId = null (Global Room)
        // Ensure streamId is actually null if isGlobal is true
        const finalStreamId = isGlobal ? null : streamId;

        // If Moderated and not admin, message is pending
        // Note: isApproved must be explicit boolean
        const isApproved = !isModerated || isAdmin;

        console.log('Chat Decision:', { finalStreamId, isApproved });

        const dto = new CreateMessageDTO(userId, userName, userRole, content);
        dto.streamId = finalStreamId;
        dto.isApproved = isApproved;


        const badWords = ['bad', 'offensive', 'spam'];
        const containsBadWord = badWords.some(word => content.toLowerCase().includes(word));

        if (containsBadWord) {
            dto.content = '*** (Redacted by System) ***';
        }

        const savedMessage = await this.chatRepository.create(dto);
        const responseDTO = ChatMapper.toDTO(savedMessage);

        if (isApproved) {
            this.io.emit('chat:message', responseDTO);
        } else {
            // Notify admins of pending message
            this.io.emit('chat:pending', responseDTO);
        }

        return responseDTO;
    }

    async approveMessage(id) {
        const approvedMsg = await this.chatRepository.approve(id);
        if (approvedMsg) {
            const dto = ChatMapper.toDTO(approvedMsg);
            this.io.emit('chat:message', dto);
            // Optionally emit to remove from pending list if we have one
            this.io.emit('chat:approved', { id });
        }
        return approvedMsg;
    }

    async deleteMessage(id) {
        await this.chatRepository.delete(id);
        this.io.emit('chat:delete', { id });
        return true;
    }

    async toggleHighlight(id) {
        const updatedMsg = await this.chatRepository.toggleHighlight(id);
        if (updatedMsg) {
            const dto = ChatMapper.toDTO(updatedMsg);
            this.io.emit('chat:update', dto);
        }
        return updatedMsg;
    }

    async banUser(userId) {
        await this.userRepository.updateStatus(userId, 'banned');
        return true;
    }

    async unbanUser(userId) {
        await this.userRepository.updateStatus(userId, 'active');
        return true;
    }
}

module.exports = ChatService;
