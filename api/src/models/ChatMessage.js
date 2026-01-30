class ChatMessage {
    constructor(id, userId, userName, userRole, content, isDeleted, createdAt, isHighlighted) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.content = content;
        this.isDeleted = isDeleted || false;
        this.createdAt = createdAt;
        this.isHighlighted = isHighlighted || false;
    }
}

module.exports = ChatMessage;
