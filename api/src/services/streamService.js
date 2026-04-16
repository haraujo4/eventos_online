class StreamService {
    constructor(mediaEventRepository, streamRepository, minioService, io) {
        this.mediaEventRepository = mediaEventRepository;
        this.streamRepository = streamRepository;
        this.minioService = minioService;
        this.io = io;
    }

    async getAllEvents() {
        return await this.mediaEventRepository.findAll();
    }

    async getEventById(id) {
        return await this.mediaEventRepository.findById(id);
    }

    async createEvent(eventDTO, posterFile, streamFiles = {}) {
        let posterUrl = eventDTO.posterUrl;

        if (posterFile) {
            const filename = `${Date.now()}-event-poster-${posterFile.originalname}`;
            posterUrl = await this.minioService.uploadThumbnail(filename, posterFile.buffer);
        }

        const event = await this.mediaEventRepository.create({
            ...eventDTO,
            posterUrl
        });

        if (eventDTO.streams && Array.isArray(eventDTO.streams)) {
            for (let i = 0; i < eventDTO.streams.length; i++) {
                const streamData = eventDTO.streams[i];
                let filePath = null;

                const fileKey = `video_${i}`;
                if (streamFiles[fileKey]) {
                    const videoFile = streamFiles[fileKey][0];
                    const filename = `${Date.now()}-video-${streamData.language}-${videoFile.originalname}`;
                    filePath = await this.minioService.uploadVideo(filename, videoFile.buffer);
                }

                await this.streamRepository.create({
                    eventId: event.id,
                    language: streamData.language,
                    url: streamData.url || filePath,
                    type: streamData.type || (filePath ? 'file' : 'youtube'),
                    filePath: filePath,
                    chat_enabled: streamData.chat_enabled,
                    chat_moderated: streamData.chat_moderated,
                    polls_enabled: streamData.polls_enabled,
                    questions_enabled: streamData.questions_enabled,
                    comments_enabled: streamData.comments_enabled
                });
            }
        }

        return await this.getEventById(event.id);
    }

    async updateEvent(id, eventDTO, posterFile, streamFiles = {}) {
        let posterUrl = eventDTO.posterUrl;

        if (posterFile) {
            const filename = `${Date.now()}-event-poster-${posterFile.originalname}`;
            posterUrl = await this.minioService.uploadThumbnail(filename, posterFile.buffer);
        }

        // 1. Atualizar metadados do evento
        await this.mediaEventRepository.update(id, {
            ...eventDTO,
            posterUrl
        });

        // 2. Atualizar Streams (Idiomas) de forma não destrutiva
        if (eventDTO.streams && Array.isArray(eventDTO.streams)) {
            const currentStreams = await this.streamRepository.findByEventId(id);
            const currentIds = currentStreams.map(s => s.id);
            const newStreamIds = eventDTO.streams.map(s => s.id).filter(id => id);

            // Deletar apenas streams que foram removidas
            const idsToDelete = currentIds.filter(cid => !newStreamIds.includes(cid));
            for (const sid of idsToDelete) {
                await this.streamRepository.delete(sid);
            }
            
            for (let i = 0; i < eventDTO.streams.length; i++) {
                const streamData = eventDTO.streams[i];
                let filePath = streamData.filePath || null;

                const fileKey = `video_${i}`;
                if (streamFiles[fileKey]) {
                    const videoFile = streamFiles[fileKey][0];
                    const filename = `${Date.now()}-video-upd-${streamData.language}-${videoFile.originalname}`;
                    filePath = await this.minioService.uploadVideo(filename, videoFile.buffer);
                }

                const streamPayload = {
                    eventId: id,
                    language: streamData.language,
                    url: streamData.url || filePath,
                    type: streamData.type,
                    filePath: filePath,
                    chat_enabled: streamData.chat_enabled,
                    chat_moderated: streamData.chat_moderated,
                    polls_enabled: streamData.polls_enabled,
                    questions_enabled: streamData.questions_enabled,
                    comments_enabled: streamData.comments_enabled
                };

                if (streamData.id) {
                    await this.streamRepository.update(streamData.id, streamPayload);
                } else {
                    await this.streamRepository.create(streamPayload);
                }
            }
        }

        const updatedEvent = await this.getEventById(id);
        
        if (this.io) {
            this.io.emit('media:update', { 
                type: 'update', 
                event: updatedEvent 
            });
        }

        return updatedEvent;
    }

    async deleteEvent(id) {
        await this.mediaEventRepository.delete(id);
    }

    async toggleEventLive(id, isLive) {
        console.log(`[StreamService] Toggling live status for event ${id} to ${isLive}`);
        const event = await this.mediaEventRepository.toggleLive(id, isLive);
        
        if (!event) {
            console.error(`[StreamService] Event with ID ${id} not found during toggleLive`);
            throw new Error('Evento não encontrado');
        }

        // Broadcast a mudança para todos os clientes
        if (this.io) {
            console.log(`[StreamService] Broadcasting media:update for event ${id}`);
            this.io.emit('media:update', { 
                type: 'update', 
                event: { id: event.id, is_live: event.is_live } 
            });
        }
        
        return event;
    }
}

module.exports = StreamService;
