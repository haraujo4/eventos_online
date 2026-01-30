class CreateMessageDTO {
    constructor(userId, userName, userRole, content, streamId, isApproved) {
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.content = content;
        this.streamId = streamId;
        this.isApproved = isApproved;
    }
}

class MessageResponseDTO {
    constructor(message) {
        this.id = message.id;
        this.userId = message.userId;
        this.userName = message.userName;
        this.userRole = message.userRole;
        this.content = message.content;
        this.createdAt = message.createdAt;
        this.isHighlighted = message.isHighlighted;
        this.streamId = message.streamId;
        this.isApproved = message.isApproved;
        this.streamName = message.streamName;
    }
}

module.exports = {
    CreateMessageDTO,
    MessageResponseDTO
};
