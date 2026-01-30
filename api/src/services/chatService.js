const ChatMapper = require('../mappings/ChatMapper');
const { CreateMessageDTO } = require('../dtos/ChatDTOs');

class ChatService {
    constructor(chatRepository, userRepository, io) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.io = io;
    }

    async getRecentMessages() {
        const messages = await this.chatRepository.findRecent();
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

    async saveAndBroadcast(userId, userName, userRole, content) {
        
        const user = await this.userRepository.findById(userId);
        if (user && user.status === 'banned') {
            throw new Error('You are banned from the chat.');
        }

        
        if (!content || content.trim() === '') return null;

        const dto = new CreateMessageDTO(userId, userName, userRole, content);

        
        const badWords = ['bad', 'offensive', 'spam']; 
        const containsBadWord = badWords.some(word => content.toLowerCase().includes(word));

        if (containsBadWord) {
            dto.content = '*** (Redacted by System) ***';
            
        }

        
        const savedMessage = await this.chatRepository.create(dto);
        const responseDTO = ChatMapper.toDTO(savedMessage);

        
        this.io.emit('chat:message', responseDTO);

        return responseDTO;
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
