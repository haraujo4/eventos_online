const eventService = require('../services/eventService');

class EventController {
    constructor() {
        this.io = null;
        this.getSettings = this.getSettings.bind(this);
        this.updateSettings = this.updateSettings.bind(this);
        this.updateAuthFields = this.updateAuthFields.bind(this);
        this.uploadLogo = this.uploadLogo.bind(this);
        this.uploadBackground = this.uploadBackground.bind(this);
        this.removeBackground = this.removeBackground.bind(this);
        this.resetEvent = this.resetEvent.bind(this);
    }

    setSocket(io) {
        this.io = io;
    }

    async getSettings(req, res) {
        try {
            const data = await eventService.getSettings();
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching settings' });
        }
    }

    async updateSettings(req, res) {
        try {
            const updated = await eventService.updateSettings(req.body);

            if (this.io) {
                this.io.emit('settings:update', updated);
            }

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error updating settings' });
        }
    }

    async updateAuthFields(req, res) {
        try {
            await eventService.updateAuthFields(req.body);
            res.json({ message: 'Auth fields updated' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error updating auth fields' });
        }
    }

    async uploadLogo(req, res) {
        try {
            const updated = await eventService.uploadLogo(req.file);

            if (this.io) {
                this.io.emit('settings:update', updated);
            }

            res.json({ logoUrl: updated.logo_url, settings: updated });
        } catch (err) {
            console.error(err);
            const message = err.message === 'No file provided'
                ? 'No file uploaded'
                : 'Error uploading logo';
            res.status(err.message === 'No file provided' ? 400 : 500).json({ message });
        }
    }

    async uploadBackground(req, res) {
        try {
            const updated = await eventService.uploadBackground(req.file);

            if (this.io) {
                this.io.emit('settings:update', updated);
            }

            res.json({ backgroundUrl: updated.background_url, settings: updated });
        } catch (err) {
            console.error(err);
            const message = err.message === 'No file provided'
                ? 'No file uploaded'
                : 'Error uploading background';
            res.status(err.message === 'No file provided' ? 400 : 500).json({ message });
        }
    }

    async removeBackground(req, res) {
        try {
            const updated = await eventService.removeBackground();

            if (this.io) {
                this.io.emit('settings:update', updated);
            }

            res.json({ message: 'Background removed' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error removing background' });
        }
    }

    async resetEvent(req, res) {
        try {
            await eventService.resetEvent();

            if (this.io) {
                this.io.emit('event:reset');
            }

            res.json({ message: 'Event reset successfully' });
        } catch (err) {
            console.error('Error resetting event:', err);
            res.status(500).json({ message: 'Error resetting event' });
        }
    }
}

module.exports = new EventController();
