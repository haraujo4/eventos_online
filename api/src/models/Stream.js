class Stream {
    constructor(id, language, url, posterUrl, isActive, filePath, createdAt, type, title, description) {
        this.id = id;
        this.language = language;
        this.url = url;
        this.posterUrl = posterUrl;
        this.isActive = isActive;
        this.filePath = filePath;
        this.createdAt = createdAt;
        this.type = type || 'direct';
        this.title = title;
        this.description = description;
    }
}

module.exports = Stream;
