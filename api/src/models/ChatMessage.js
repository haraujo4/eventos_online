class ChatMessage {
    constructor(id, userId, userName, userRole, content, isDeleted, createdAt, isHighlighted, streamId, isApproved, streamName, eventTitle, userEmail) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.content = content;
        this.isDeleted = isDeleted || false;
        this.createdAt = createdAt;
        this.isHighlighted = isHighlighted || false;
        this.streamId = streamId;
        this.isApproved = isApproved !== undefined ? isApproved : true;
        this.streamName = streamName;
        this.eventTitle = eventTitle;
        this.userEmail = userEmail;
    }
}

module.exports = ChatMessage;
