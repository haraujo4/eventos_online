const db = require('../config/db');

class AnalyticsService {
    constructor(io) {
        this.io = io;
        this.currentViewers = 0;
        this.setupRealtimeListeners();
        this.startTracking();
    }

    setupRealtimeListeners() {
        this.io.on('connection', (socket) => {
            
            
            

            socket.on('join:viewers', async (data) => {
                socket.join('viewers');
                this.broadcastCount();

                
                if (data && data.userId) {
                    try {
                        await db.query(
                            'INSERT INTO session_logs (user_id, socket_id, ip_address, entry_time) VALUES ($1, $2, $3, $4)',
                            [data.userId, socket.id, socket.handshake.address, new Date()]
                        );
                    } catch (err) {
                        console.error('Error logging session start:', err);
                    }
                }
            });

            socket.on('leave:viewers', async () => {
                socket.leave('viewers');
                this.broadcastCount();
                await this.endSession(socket.id);
            });

            socket.on('disconnect', async () => {
                
                
                this.broadcastCount();
                await this.endSession(socket.id);
            });
        });
    }

    async endSession(socketId) {
        try {
            
            const session = await db.query(
                `SELECT * FROM session_logs WHERE socket_id = $1 AND exit_time IS NULL LIMIT 1`,
                [socketId]
            );

            if (session.rows.length > 0) {
                const entryTime = new Date(session.rows[0].entry_time);
                const exitTime = new Date();
                const duration = Math.floor((exitTime - entryTime) / 1000); 

                await db.query(
                    `UPDATE session_logs SET exit_time = $1, duration = $2 WHERE id = $3`,
                    [exitTime, duration, session.rows[0].id]
                );
            }
        } catch (err) {
            console.error('Error ending session:', err);
        }
    }

    broadcastCount() {
        
        const room = this.io.sockets.adapter.rooms.get('viewers');
        const count = room ? room.size : 0;
        this.io.emit('stats:viewers', { count });
        this.currentViewers = count;
    }

    startTracking() {
        
        setInterval(async () => {
            try {
                await this.saveSnapshot(this.currentViewers);
            } catch (err) {
                console.error('Error saving analytics snapshot:', err);
            }
        }, 60000);
    }

    updateViewerCount(count) {
        this.currentViewers = count;
        this.io.emit('stats:viewers', { count });
    }

    async saveSnapshot(count) {
        await db.query(
            'INSERT INTO analytics (active_viewers) VALUES ($1)',
            [count]
        );
    }

    async getHistory(interval = 'minute') {
        let query;

        if (interval === 'hour') {
            
            query = `
                SELECT 
                    date_trunc('hour', recorded_at) as time_bucket,
                    ROUND(AVG(active_viewers)) as active_viewers
                FROM analytics
                WHERE recorded_at >= NOW() - INTERVAL '24 hours'
                GROUP BY time_bucket
                ORDER BY time_bucket DESC
            `;
        } else if (interval === 'day') {
            
            query = `
                SELECT 
                    date_trunc('day', recorded_at) as time_bucket,
                    ROUND(AVG(active_viewers)) as active_viewers
                FROM analytics
                WHERE recorded_at >= NOW() - INTERVAL '7 days'
                GROUP BY time_bucket
                ORDER BY time_bucket DESC
            `;
        } else {
            
            return (await db.query(
                'SELECT active_viewers, recorded_at as time_bucket FROM analytics ORDER BY recorded_at DESC LIMIT 60'
            )).rows.reverse();
        }

        const result = await db.query(query);
        return result.rows.reverse();
    }
    async getAudienceReport() {
        
        const query = `
            SELECT 
                u.name,
                u.email,
                sl.entry_time,
                sl.exit_time,
                sl.duration
            FROM session_logs sl
            JOIN users u ON sl.user_id = u.id
            ORDER BY sl.entry_time DESC
        `;

        const result = await db.query(query);
        return result.rows;
    }
}

module.exports = AnalyticsService;
