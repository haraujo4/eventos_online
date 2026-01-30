const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
require('dotenv').config();

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
container.init(io);
reactionController.setSocket(io);



io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('chat:message', async (msg) => {






        try {
            const container = require('./container');
            await container.chatService.saveAndBroadcast(
                msg.userId || null,
                msg.userName || 'Guest',
                msg.userRole || 'viewer',
                msg.content
            );
        } catch (err) {
            console.error('Error handling chat message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});


module.exports = { server, io };

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
