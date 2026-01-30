class CreateStreamDTO {
    constructor(language, url, posterUrl, type, title, description) {
        this.language = language;
        this.url = url;
        this.posterUrl = posterUrl;
        this.type = type;
        this.title = title;
        this.description = description;
    }
}

class UpdateStreamDTO {
    constructor(language, url, posterUrl, type, title, description) {
        this.language = language;
        this.url = url;
        this.posterUrl = posterUrl;
        this.type = type;
        this.title = title;
        this.description = description;
    }
}

class StreamResponseDTO {
    constructor(stream) {
        this.id = stream.id;
        this.language = stream.language;
        this.url = stream.url;
        this.posterUrl = stream.posterUrl;
        this.isActive = stream.isActive;
        this.createdAt = stream.createdAt;
        this.isLocalFile = !!stream.filePath;
        this.type = stream.type;
        this.title = stream.title;
        this.description = stream.description;
    }
}

module.exports = {
    CreateStreamDTO,
    UpdateStreamDTO,
    StreamResponseDTO
};
