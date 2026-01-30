const { LoginDTO, RegisterUserDTO } = require('../dtos/UserDTOs');

class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const loginDTO = new LoginDTO(email, password);
            const result = await this.authService.login(loginDTO);
            res.json(result);
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }

    async register(req, res) {
        try {
            const { email, password, name, role, customData } = req.body;
            const registerDTO = new RegisterUserDTO(email, password, name, role, customData);
            const result = await this.authService.register(registerDTO);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async me(req, res) {
        res.json(req.user);
    }

    async verify2FA(req, res) {
        try {
            const { userId, code } = req.body;
            const result = await this.authService.verify2FA(userId, code);
            res.json(result);
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }
}

module.exports = AuthController;
