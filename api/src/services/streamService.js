const StreamMapper = require('../mappings/StreamMapper');
const { CreateStreamDTO, UpdateStreamDTO } = require('../dtos/StreamDTOs');

class StreamService {
    constructor(streamRepository, minioService, io) {
        this.streamRepository = streamRepository;
        this.minioService = minioService;
        this.io = io;
    }

    async getAllStreams() {
        
        const streams = await this.streamRepository.findAll();
        const isLive = await this.streamRepository.getSetting('is_live');

        
        
        
        
        return {
            streams: streams.map(stream => StreamMapper.toDTO(stream)),
            isLive: isLive ? isLive.value : false 
        };
    }

    async setLiveStatus(isLive) {
        await this.streamRepository.setSetting('is_live', { value: isLive });
        this.io.emit('stream:status', { isLive });
        return isLive;
    }

    async createStream(createStreamDTO, videoFile, posterFile) {
        let url = createStreamDTO.url;
        let posterUrl = createStreamDTO.posterUrl;
        let filePath = null;
        let type = createStreamDTO.type || 'direct'; 

        if (videoFile) {
            const filename = `${Date.now()}-${videoFile.originalname}`;
            url = await this.minioService.uploadVideo(filename, videoFile.buffer);
            filePath = filename;
            type = 'file'; 
        }

        if (posterFile) {
            const filename = `${Date.now()}-poster-${posterFile.originalname}`;
            posterUrl = await this.minioService.uploadThumbnail(filename, posterFile.buffer);
        }

        
        const newStreamModel = await this.streamRepository.create({
            language: createStreamDTO.language,
            url: url,
            posterUrl: posterUrl,
            filePath: filePath,
            type: type,
            title: createStreamDTO.title,
            description: createStreamDTO.description
        });

        const dto = StreamMapper.toDTO(newStreamModel);

        
        this.io.emit('media:update', { type: 'add', stream: dto });

        return dto;
    }

    async updateStream(id, updateStreamDTO, videoFile, posterFile) {
        let updates = {
            language: updateStreamDTO.language,
            url: updateStreamDTO.url,
            posterUrl: updateStreamDTO.posterUrl,
            type: updateStreamDTO.type,
            title: updateStreamDTO.title,
            description: updateStreamDTO.description
        };

        if (videoFile) {
            const filename = `${Date.now()}-${videoFile.originalname}`;
            updates.url = await this.minioService.uploadVideo(filename, videoFile.buffer);
            updates.filePath = filename;
        }

        if (posterFile) {
            const filename = `${Date.now()}-poster-${posterFile.originalname}`;
            updates.posterUrl = await this.minioService.uploadThumbnail(filename, posterFile.buffer);
        }

        const updatedStreamModel = await this.streamRepository.update(id, updates);

        if (updatedStreamModel) {
            const dto = StreamMapper.toDTO(updatedStreamModel);
            this.io.emit('media:update', { type: 'update', stream: dto });
            return dto;
        }

        return null;
    }

    async deleteStream(id) {
        await this.streamRepository.delete(id);
        this.io.emit('media:update', { type: 'delete', id });
        return true;
    }

    
}

module.exports = StreamService;
