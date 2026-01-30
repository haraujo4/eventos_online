
const db = require('./config/db');


const StreamRepository = require('./repositories/streamRepository');
const UserRepository = require('./repositories/userRepository');
const ChatRepository = require('./repositories/chatRepository');


const StreamService = require('./services/streamService');
const minioService = require('./services/minioService'); 
const AuthService = require('./services/authService');
const UserService = require('./services/userService');
const ChatService = require('./services/chatService');
const StatsService = require('./services/statsService');
const MailService = require('./services/MailService');
const AnalyticsService = require('./services/analyticsService');


const MediaController = require('./controllers/mediaController');
const AuthController = require('./controllers/authController');
const UserController = require('./controllers/userController');
const ChatController = require('./controllers/chatController');
const StatsController = require('./controllers/statsController');

class Container {
    constructor() {
        
        this.streamRepository = new StreamRepository();
        this.userRepository = new UserRepository();
        this.chatRepository = new ChatRepository();

        
        this.mailService = new MailService();
        this.authService = new AuthService(this.userRepository, this.mailService);
        this.userService = new UserService(this.userRepository);
    }

    init(io) {
        
        this.streamService = new StreamService(
            this.streamRepository,
            minioService,
            io
        );
        this.chatService = new ChatService(this.chatRepository, this.userRepository, io);
        this.chatService = new ChatService(this.chatRepository, this.userRepository, io);
        this.statsService = new StatsService(this.userRepository, this.streamRepository, this.chatRepository);
        this.analyticsService = new AnalyticsService(io);

        
        this.mediaController = new MediaController(this.streamService);
        this.authController = new AuthController(this.authService); 
        this.userController = new UserController(this.userService);
        this.chatController = new ChatController(this.chatService);
        this.chatController = new ChatController(this.chatService);
        this.statsController = new StatsController(this.statsService, this.analyticsService);
    }
}

const container = new Container();

module.exports = container;
