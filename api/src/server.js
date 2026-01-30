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
const pollController = require('./controllers/pollController');
const commentController = require('./controllers/commentController');
const questionController = require('./controllers/questionController');
const eventController = require('./controllers/eventController');

container.init(io);
reactionController.setSocket(io);
pollController.setSocket(io);
commentController.setSocket(io);
questionController.setSocket(io);
eventController.setSocket(io);



io.on('connection', (socket) => {

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
    });
});


module.exports = { server, io };

if (require.main === module) {
    server.listen(PORT, () => {
    });
}
