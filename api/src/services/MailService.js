const nodemailer = require('nodemailer');
const db = require('../config/db');

class MailService {
    constructor() { }

    async getTransporter() {
        const result = await db.query('SELECT smtp_config FROM event_settings LIMIT 1');
        const settings = result.rows[0];

        if (!settings || !settings.smtp_config || !settings.smtp_config.host) {
            throw new Error('SMTP configuration not found');
        }

        const config = settings.smtp_config;

        return nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port, 10),
            secure: config.secure, 
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
    }

    async sendMail(to, subject, text, html) {
        try {
            const transporter = await this.getTransporter();
            const info = await transporter.sendMail({
                from: '"Event Platform" <no-reply@eventplatform.com>', 
                to,
                subject,
                text,
                html,
            });
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            
            
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
}

module.exports = MailService;
