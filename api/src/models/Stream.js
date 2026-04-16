class Stream {
    constructor(id, eventId, language, url, type, filePath, isActive, createdAt) {
        this.id = id;
        this.eventId = eventId;
        this.language = language;
        this.url = url;
        this.type = type;
        this.filePath = filePath;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }
}

module.exports = Stream;
