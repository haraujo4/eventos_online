const ChatMapper = require('../mappings/ChatMapper');
const { CreateMessageDTO } = require('../dtos/ChatDTOs');
const db = require('../config/db');

class ChatService {
    constructor(chatRepository, userRepository, io) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.io = io;
    }

    async getRecentMessages(streamId, isAdmin = false, requesterId = null) {
        // Buscar se o chat deste evento é global ou restrito
        const settingsRes = await db.query(`
            SELECT e.chat_global 
            FROM media_events e
            JOIN streams s ON e.id = s.event_id
            WHERE s.id = $1
        `, [streamId]);
        const isGlobal = settingsRes.rows[0]?.chat_global ?? true;

        // Pass requesterId to repository
        const messages = await this.chatRepository.findRecent(streamId, isGlobal, 50, isAdmin, requesterId);
        return messages.map(msg => ChatMapper.toDTO(msg));
    }

    async getPendingMessages(eventId = null) {
        const messages = await this.chatRepository.findPending(eventId);
        return messages.map(msg => ChatMapper.toDTO(msg));
    }

    async exportChat(eventId = null) {
        const messages = await this.chatRepository.findAll(eventId);
        const xlsx = require('xlsx');

        const data = messages.map(msg => ({
            ID: msg.id,
            Date: new Date(msg.createdAt).toLocaleString('pt-BR'),
            User: msg.userName,
            Email: msg.userEmail || 'N/A',
            Role: msg.userRole,
            Event: msg.eventTitle || 'N/A',
            Language: msg.streamLanguage || 'N/A',
            Content: msg.content,
            Highlighted: msg.isHighlighted ? 'Yes' : 'No',
            Approved: msg.isApproved ? 'Yes' : 'No',
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


        const settingsRes = await db.query(`
            SELECT e.chat_moderated, e.chat_global, s.chat_moderated as stream_moderated
            FROM media_events e
            JOIN streams s ON e.id = s.event_id
            WHERE s.id = $1
        `, [streamId]);
        
        const settings = settingsRes.rows[0] || {};
        const isGlobal = settings.chat_global ?? true;
        
        const isEventModerated = settings.chat_moderated === true;
        const isStreamModerated = settings.stream_moderated === true;
        
        // Se estiver moderado no evento OU no stream, ativa.
        const isModerated = isEventModerated || isStreamModerated;
        const isAdmin = ['admin', 'moderator'].includes(userRole);

        console.log(`DEBUG: Chat Message from ${userName} (${userRole}) - streamId: ${streamId} - eventMod: ${isEventModerated} - streamMod: ${isStreamModerated} - isModerated: ${isModerated} - isAdmin: ${isAdmin}`);


        if (!content || content.trim() === '') return null;

        // Sempre salvar o streamId original para saber a qual evento a mensagem pertence
        const finalStreamId = streamId;

        // Se for Moderado e não for admin, a mensagem fica pendente
        const isApproved = !isModerated || isAdmin;


        const dto = new CreateMessageDTO(userId, userName, userRole, content, finalStreamId, isApproved);


        const badWords = ['bad', 'offensive', 'spam'];
        const containsBadWord = badWords.some(word => content.toLowerCase().includes(word));

        if (containsBadWord) {
            dto.content = '*** (Redacted by System) ***';
        }

        const savedMessage = await this.chatRepository.create(dto);
        const responseDTO = ChatMapper.toDTO(savedMessage);

        // Determinar a sala de destino
        const room = isGlobal ? `event_${(await db.query('SELECT event_id FROM streams WHERE id = $1', [streamId])).rows[0]?.event_id}` : `stream_${streamId}`;

        if (isApproved) {
            // Se aprovada, envia para a sala do evento/stream
            this.io.to(room).emit('chat:message', responseDTO);
        } else {
            // Se pendente, avisa apenas os admins (emit global ou sala de admins se houver)
            this.io.emit('chat:pending', responseDTO);
        }

        return responseDTO;
    }

    async approveMessage(id) {
        const approvedMsg = await this.chatRepository.approve(id);
        if (approvedMsg) {
            const dto = ChatMapper.toDTO(approvedMsg);
            
            // Buscar as configurações do evento para este stream
            const settingsRes = await db.query(`
                SELECT e.chat_global 
                FROM media_events e
                JOIN streams s ON e.id = s.event_id
                WHERE s.id = $1
            `, [approvedMsg.stream_id]);
            const isGlobal = settingsRes.rows[0]?.chat_global ?? true;
            
            // Buscar o eventId deste stream
            const streamRes = await db.query('SELECT event_id FROM streams WHERE id = $1', [approvedMsg.stream_id]);
            const eventId = streamRes.rows[0]?.event_id;

            const room = isGlobal ? `event_${eventId}` : `stream_${approvedMsg.stream_id}`;

            // Avisar a todos na sala que há uma nova mensagem aprovada
            this.io.to(room).emit('chat:message', dto);
            // Avisar especificamente os moderadores para remover da lista pendente
            this.io.emit('chat:approved', dto);
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
