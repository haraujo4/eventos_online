class CreateStreamDTO {
    constructor(language, url, posterUrl, type, title, description, category, is_featured, scheduled_at) {
        this.language = language;
        this.url = url;
        this.posterUrl = posterUrl;
        this.type = type;
        this.title = title;
        this.description = description;
        this.category = category;
        this.is_featured = is_featured;
        this.scheduled_at = scheduled_at;
    }
}

class UpdateStreamDTO {
    constructor(language, url, posterUrl, type, title, description, category, is_featured, scheduled_at) {
        this.language = language;
        this.url = url;
        this.posterUrl = posterUrl;
        this.type = type;
        this.title = title;
        this.description = description;
        this.category = category;
        this.is_featured = is_featured;
        this.scheduled_at = scheduled_at;
    }
}

class StreamResponseDTO {
    constructor(stream) {
        this.id = stream.id;
        this.language = stream.language;
        this.url = stream.url;
        this.poster_url = stream.posterUrl;
        this.isActive = stream.isActive;
        this.createdAt = stream.createdAt;
        this.isLocalFile = !!stream.filePath;
        this.type = stream.type;
        this.title = stream.title;
        this.description = stream.description;
        this.category = stream.category;
        this.is_featured = stream.isFeatured;
        this.scheduled_at = stream.scheduledAt;
        this.views = stream.views;
    }
}

module.exports = {
    CreateStreamDTO,
    UpdateStreamDTO,
    StreamResponseDTO
};
