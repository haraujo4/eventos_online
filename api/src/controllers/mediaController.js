const { CreateStreamDTO, UpdateStreamDTO } = require('../dtos/StreamDTOs');

class MediaController {
    constructor(streamService) {
        this.streamService = streamService;
    }

    async getAll(req, res) {
        try {
            const data = await this.streamService.getAllStreams();
            
            
            
            
            res.json(data);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async create(req, res) {
        try {

            const files = req.files || {};
            const videoFile = files.video ? files.video[0] : null;
            const posterFile = files.poster ? files.poster[0] : null;

            
            const createStreamDTO = new CreateStreamDTO(
                req.body.language,
                req.body.url,
                req.body.poster_url,
                req.body.type,
                req.body.title,
                req.body.description
            );

            const stream = await this.streamService.createStream(createStreamDTO, videoFile, posterFile);
            res.status(201).json(stream);
        } catch (err) {
            console.error("DEBUG: createStream Error:", err);
            console.error(err.stack);
            res.status(400).json({ message: err.message, stack: err.stack });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const files = req.files || {};
            const videoFile = files.video ? files.video[0] : null;
            const posterFile = files.poster ? files.poster[0] : null;

            const updateStreamDTO = new UpdateStreamDTO(
                req.body.language,
                req.body.url,
                req.body.poster_url,
                req.body.type,
                req.body.title,
                req.body.description
            );

            const stream = await this.streamService.updateStream(id, updateStreamDTO, videoFile, posterFile);
            if (!stream) {
                return res.status(404).json({ message: 'Stream not found' });
            }
            res.json(stream);
        } catch (err) {
            console.error(err);
            res.status(400).json({ message: err.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await this.streamService.deleteStream(id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async toggleLive(req, res) {
        try {
            const { isLive } = req.body;
            const status = await this.streamService.setLiveStatus(isLive);
            res.json({ isLive: status });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = MediaController;
