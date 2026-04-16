console.log('--- API STARTING ---');
console.log('Checking Environment Variables...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('PORT:', process.env.PORT || 3000);

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const container = require('./container');
const reactionController = require('./controllers/reactionController');
const pollController = require('./controllers/pollController');
const commentController = require('./controllers/commentController');
const questionController = require('./controllers/questionController');
const eventController = require('./controllers/eventController');

console.log('Initializing modules...');
container.init(io);
reactionController.setSocket(io);
pollController.setSocket(io);
commentController.setSocket(io);
questionController.setSocket(io);
eventController.setSocket(io);

io.on('connection', (socket) => {
    socket.on('join:room', ({ streamId }) => {
        if (!streamId) return;
        // Entrar na sala específica do stream/idioma
        socket.join(`stream_${streamId}`);
        
        // Também entrar na sala do EVENTO para suportar Chat Global por Evento
        db.query('SELECT event_id FROM streams WHERE id = $1', [streamId])
            .then(res => {
                if (res.rows[0]) {
                    socket.join(`event_${res.rows[0].event_id}`);
                }
            }).catch(err => console.error('Error joining event room:', err));
    });

    socket.on('chat:message', async (msg) => {
        try {
            const container = require('./container');
            await container.chatService.saveAndBroadcast(
                msg.userId || null,
                msg.userName || 'Guest',
                msg.userRole || 'viewer',
                msg.content,
                msg.streamId
            );
        } catch (err) {
            console.error('Error handling chat message:', err);
        }
    });

    socket.on('disconnect', () => {
        // Socket.io limpa as salas automaticamente
    });
});

module.exports = { server, io };

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`--- API SUCCESS ---`);
        console.log(`Server running on port ${PORT}`);
    });
}
