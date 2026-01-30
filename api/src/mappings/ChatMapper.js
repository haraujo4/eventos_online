const ChatMessage = require('../models/ChatMessage');
const { MessageResponseDTO } = require('../dtos/ChatDTOs');

class ChatMapper {
    static toDomain(dbRow) {
        if (!dbRow) return null;
        return new ChatMessage(
            dbRow.id,
            dbRow.user_id,
            dbRow.user_name,
            dbRow.user_role,
            dbRow.content,
            dbRow.is_deleted,
            dbRow.created_at,
            dbRow.is_highlighted,
            dbRow.stream_id,
            dbRow.is_approved,
            dbRow.stream_title || dbRow.stream_language || (dbRow.stream_id ? 'Unknown Stream' : 'Global')
        );
    }

    static toDTO(messageModel) {
        if (!messageModel) return null;
        return new MessageResponseDTO(messageModel);
    }
}

module.exports = ChatMapper;
