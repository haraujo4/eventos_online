class StatsController {
    constructor(statsService, analyticsService) {
        this.statsService = statsService;
        this.analyticsService = analyticsService;
    }

    async getStats(req, res) {
        try {
            const stats = await this.statsService.getDashboardStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async getHistory(req, res) {
        try {
            const { interval } = req.query; 
            const history = await this.analyticsService.getHistory(interval);
            res.json(history);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching history' });
        }
    }
    async exportAudienceReport(req, res) {
        try {
            const data = await this.analyticsService.getAudienceReport();

            
            const reportData = data.map(item => ({
                'Nome': item.name,
                'Email': item.email,
                'Entrada': item.entry_time ? new Date(item.entry_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-',
                'Saída': item.exit_time ? new Date(item.exit_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Online',
                'Duração (minutos)': item.duration ? Math.floor(item.duration / 60) : '-'
            }));

            const xlsx = require('xlsx');
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(reportData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Audiencia');

            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=audience_report.xlsx');
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error exporting audience report' });
        }
    }
}

module.exports = StatsController;
