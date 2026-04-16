const { MediaEventResponseDTO, CreateMediaEventDTO } = require('../dtos/MediaDTOs');

class MediaController {
    constructor(streamService) {
        this.streamService = streamService;
    }

    async getAll(req, res) {
        try {
            const events = await this.streamService.getAllEvents();
            const eventRepository = require('../repositories/eventRepository');
            const settings = await eventRepository.getSettings();
            
            const dtos = events.map(e => new MediaEventResponseDTO(e));
            res.json({
                events: dtos,
                isLive: settings?.is_live || false
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar mídias' });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const event = await this.streamService.getEventById(id);
            if (!event) return res.status(404).json({ message: 'Evento não encontrado' });
            res.json(new MediaEventResponseDTO(event));
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar detalhes do evento' });
        }
    }

    async create(req, res) {
        try {
            const filesArray = req.files || [];
            const filesMap = {};
            let posterFile = null;

            // Organizar arquivos do upload.any()
            filesArray.forEach(file => {
                if (file.fieldname === 'poster') {
                    posterFile = file;
                } else {
                    // Agrupar arquivos de vídeo no formato que o serviço espera (video_0, video_1, etc)
                    if (!filesMap[file.fieldname]) filesMap[file.fieldname] = [];
                    filesMap[file.fieldname].push(file);
                }
            });
            
            const eventDTO = new CreateMediaEventDTO(req.body);
            const event = await this.streamService.createEvent(eventDTO, posterFile, filesMap);
            res.status(201).json(new MediaEventResponseDTO(event));
        } catch (err) {
            console.error('DEBUG: createEvent Error:', err);
            res.status(400).json({ message: err.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const filesArray = req.files || [];
            let posterFile = null;

            filesArray.forEach(file => {
                if (file.fieldname === 'poster') posterFile = file;
            });
            
            const eventDTO = new CreateMediaEventDTO(req.body);
            const event = await this.streamService.updateEvent(id, eventDTO, posterFile);
            
            res.json(new MediaEventResponseDTO(event));
        } catch (err) {
            console.error(err);
            res.status(400).json({ message: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.streamService.deleteEvent(id);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao deletar mídia' });
        }
    }

    async toggleLive(req, res) {
        try {
            const { is_live } = req.body;
            const db = require('../config/db');
            await db.query('UPDATE event_settings SET is_live = $1', [is_live]);
            res.json({ success: true, isLive: is_live });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao alternar modo ao vivo' });
        }
    }

    async toggleEventLive(req, res) {
        try {
            const { id } = req.params;
            const { is_live } = req.body;
            const event = await this.streamService.toggleEventLive(id, is_live);
            res.json(new MediaEventResponseDTO(event));
        } catch (err) {
            console.error(err);
            res.status(400).json({ message: err.message });
        }
    }
}

module.exports = MediaController;
