class MediaEvent {
    constructor(id, title, description, category, posterUrl, isFeatured, scheduledAt, views, createdAt, streams = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.posterUrl = posterUrl;
        this.isFeatured = isFeatured;
        this.scheduledAt = scheduledAt;
        this.views = views;
        this.createdAt = createdAt;
        this.streams = streams; // Lista de MediaStream
    }
}

module.exports = MediaEvent;
