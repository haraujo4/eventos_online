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
                
                // Track per stream/event if provided
                if (data && data.streamId) {
                    socket.join(`viewers:stream:${data.streamId}`);
                }

                this.broadcastCount();

                if (data && data.userId) {
                    try {
                        const streamId = data.streamId || null;
                        await db.query(
                            'INSERT INTO session_logs (user_id, socket_id, ip_address, entry_time, stream_id) VALUES ($1, $2, $3, $4, $5)',
                            [data.userId, socket.id, socket.handshake.address, new Date(), streamId]
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
        // Global count
        const globalRoom = this.io.sockets.adapter.rooms.get('viewers');
        const totalCount = globalRoom ? globalRoom.size : 0;
        
        // Emmit global
        this.io.emit('stats:viewers', { count: totalCount });
        this.currentViewers = totalCount;

        // Collect and emit per-stream counts
        const streamCounts = {};
        for (const [roomName, room] of this.io.sockets.adapter.rooms) {
            if (roomName.startsWith('viewers:stream:')) {
                const streamId = roomName.split(':').pop();
                streamCounts[streamId] = room.size;
            }
        }
        this.io.emit('stats:viewers:streams', streamCounts);
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

    async getHistory(interval = 'minute', eventId = null) {
        let query;
        let params = [];

        if (eventId) {
            // Se tiver eventId, calculamos a partir dos session_logs para ser preciso por evento
            // Criamos 'snapshots' artificiais baseados na presença dos usuários
            // Isso é mais pesado porem preciso para dados históricos retroativos
            query = `
                WITH time_buckets AS (
                    SELECT generate_series(
                        NOW() - (CASE 
                            WHEN $1 = 'day' THEN INTERVAL '7 days'
                            WHEN $1 = 'hour' THEN INTERVAL '24 hours'
                            ELSE INTERVAL '1 hour'
                        END),
                        NOW(),
                        (CASE 
                            WHEN $1 = 'day' THEN INTERVAL '1 day'
                            WHEN $1 = 'hour' THEN INTERVAL '1 hour'
                            ELSE INTERVAL '1 minute'
                        END)
                    ) as bucket
                )
                SELECT 
                    tb.bucket as time_bucket,
                    COUNT(sl.id) as active_viewers
                FROM time_buckets tb
                LEFT JOIN session_logs sl ON sl.entry_time <= tb.bucket 
                    AND (sl.exit_time IS NULL OR sl.exit_time >= tb.bucket)
                    AND sl.stream_id IN (SELECT id FROM streams WHERE event_id = $2)
                GROUP BY tb.bucket
                ORDER BY tb.bucket DESC
                LIMIT 60
            `;
            params = [interval, eventId];
        } else if (interval === 'hour') {
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

        const result = await db.query(query, params);
        return result.rows.reverse();
    }
    async getOnlineUsers(eventId = null) {
        // Obter todos os sockets conectados
        const sockets = Array.from(this.io.sockets.sockets.values());
        
        // Filtrar sockets que possuem userId e streamId (espectadores logados)
        const activeSessions = sockets
            .filter(s => s.userId && s.streamId)
            .map(s => ({ userId: s.userId, streamId: s.streamId }));

        if (activeSessions.length === 0) return [];

        // Filtrar por evento se necessário
        let filteredSessions = activeSessions;
        if (eventId) {
            // Precisamos saber quais streams pertencem a este evento
            const streamsResult = await db.query('SELECT id FROM streams WHERE event_id = $1', [eventId]);
            const eventStreamIds = streamsResult.rows.map(r => r.id);
            filteredSessions = activeSessions.filter(s => eventStreamIds.includes(Number(s.streamId)));
        }

        if (filteredSessions.length === 0) return [];

        // Remover duplicatas (mesmo usuário em várias abas conta como 1)
        const uniqueUserIds = [...new Set(filteredSessions.map(s => s.userId))];

        // Buscar detalhes dos usuários no banco
        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email,
                s.language as stream_language,
                e.title as event_title,
                (SELECT entry_time FROM session_logs WHERE user_id = u.id AND exit_time IS NULL ORDER BY entry_time DESC LIMIT 1) as entry_time
            FROM users u
            JOIN session_logs sl ON sl.user_id = u.id AND sl.exit_time IS NULL
            LEFT JOIN streams s ON sl.stream_id = s.id
            LEFT JOIN media_events e ON s.event_id = e.id
            WHERE u.id = ANY($1)
            GROUP BY u.id, s.language, e.title
        `;

        const result = await db.query(query, [uniqueUserIds]);
        return result.rows;
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
