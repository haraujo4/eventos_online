const Stream = require('../models/Stream');
const { StreamResponseDTO } = require('../dtos/StreamDTOs');

class StreamMapper {
    static toDomain(dbRow) {
        if (!dbRow) return null;
        return new Stream(
            dbRow.id,
            dbRow.language,
            dbRow.url,
            dbRow.poster_url, 
            dbRow.is_active,
            dbRow.file_path,
            dbRow.created_at,
            dbRow.type,
            dbRow.title,
            dbRow.description
        );
    }

    static toPersistence(streamModel) {
        return {
            id: streamModel.id,
            language: streamModel.language,
            url: streamModel.url,
            poster_url: streamModel.posterUrl,
            is_active: streamModel.isActive,
            created_at: streamModel.createdAt,
            type: streamModel.type,
            title: streamModel.title,
            description: streamModel.description
        };
    }

    static toDTO(streamModel) {
        if (!streamModel) return null;
        return new StreamResponseDTO(streamModel);
    }
}

module.exports = StreamMapper;
