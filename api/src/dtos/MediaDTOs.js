class MediaEventResponseDTO {
    constructor(event) {
        this.id = event.id;
        this.title = event.title;
        this.description = event.description;
        this.category = event.category;
        this.poster_url = event.poster_url;
        this.is_featured = event.is_featured;
        this.scheduled_at = event.scheduled_at;
        this.views = event.views;
        this.createdAt = event.created_at;
        
        // Mapear streams se existirem (json_agg retorna array de objetos do banco)
        this.streams = (event.streams || [])
            .filter(sh => sh && sh.id) // Remover nulos do left join
            .map(s => ({
                id: s.id,
                language: s.language,
                url: s.url,
                type: s.type,
                file_path: s.file_path,
                chat_enabled: s.chat_enabled,
                chat_moderated: s.chat_moderated,
                polls_enabled: s.polls_enabled,
                questions_enabled: s.questions_enabled,
                comments_enabled: s.comments_enabled
            }));

        // Feature Flags do Evento
        this.chat_enabled = event.chat_enabled;
        this.chat_global = event.chat_global;
        this.chat_moderated = event.chat_moderated;
        this.is_live = event.is_live;
        this.polls_enabled = event.polls_enabled;
        this.questions_enabled = event.questions_enabled;
        this.comments_enabled = event.comments_enabled;
    }
}

class CreateMediaEventDTO {
    constructor(data) {
        this.title = data.title;
        this.description = data.description || null;
        this.category = data.category || 'Geral';
        this.isFeatured = data.is_featured === 'true' || data.is_featured === true;
        
        // Tratar data vazia como null para não quebrar o Postgres
        this.scheduledAt = (data.scheduled_at && data.scheduled_at.trim() !== '') ? data.scheduled_at : null;
        this.posterUrl = data.posterUrl;

        // Resource Controls
        this.chat_enabled = data.chat_enabled === 'true' || data.chat_enabled === true;
        this.chat_global = data.chat_global === 'true' || data.chat_global === true;
        this.chat_moderated = data.chat_moderated === 'true' || data.chat_moderated === true;
        this.polls_enabled = data.polls_enabled === 'true' || data.polls_enabled === true;
        this.questions_enabled = data.questions_enabled === 'true' || data.questions_enabled === true;
        this.is_live = data.is_live === 'true' || data.is_live === true;
        this.comments_enabled = data.comments_enabled === 'true' || data.comments_enabled === true;
        
        try {
            this.streams = typeof data.streams === 'string' ? JSON.parse(data.streams) : (data.streams || []);
            // Mapear flags das streams se existirem
            const toBoolOrNull = (val) => {
                if (val === null || val === undefined || val === 'null' || val === 'undefined' || val === '') return null;
                return val === 'true' || val === true;
            };

            this.streams = this.streams.map(s => ({
                ...s,
                chat_enabled: toBoolOrNull(s.chat_enabled),
                chat_moderated: toBoolOrNull(s.chat_moderated),
                polls_enabled: toBoolOrNull(s.polls_enabled),
                questions_enabled: toBoolOrNull(s.questions_enabled),
                comments_enabled: toBoolOrNull(s.comments_enabled)
            }));
        } catch (e) {
            this.streams = [];
        }
    }
}

module.exports = {
    MediaEventResponseDTO,
    CreateMediaEventDTO
};
