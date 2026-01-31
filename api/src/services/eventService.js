const eventRepository = require('../repositories/eventRepository');
const minioService = require('./minioService');

class EventService {
    async getSettings() {
        const settings = await eventRepository.getSettings();
        const authFields = await eventRepository.getAuthFields();

        return {
            settings: settings || {},
            authFields
        };
    }

    async updateSettings(settingsData) {
        return await eventRepository.updateSettings(settingsData);
    }

    async updateAuthFields(fields) {
        await eventRepository.updateAuthFields(fields);
    }

    async uploadLogo(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        const logoUrl = await minioService.uploadFile('logos', file.originalname, file.buffer, { 'Content-Type': file.mimetype });
        return await eventRepository.uploadLogo(logoUrl);
    }

    async uploadBackground(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        const backgroundUrl = await minioService.uploadFile('backgrounds', file.originalname, file.buffer, { 'Content-Type': file.mimetype });
        return await eventRepository.uploadBackground(backgroundUrl);
    }

    async removeBackground() {
        return await eventRepository.removeBackground();
    }

    async resetEvent() {
        await eventRepository.resetEvent();
    }
}

module.exports = new EventService();
