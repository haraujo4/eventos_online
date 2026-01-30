class CreateMessageDTO {
    constructor(userId, userName, userRole, content) {
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.content = content;
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
    }
}

module.exports = {
    CreateMessageDTO,
    MessageResponseDTO
};
