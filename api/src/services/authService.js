const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserMapper = require('../mappings/UserMapper');
const { AuthResponseDTO, UserResponseDTO } = require('../dtos/UserDTOs');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
}

class AuthService {
    constructor(userRepository, mailService, eventRepository) {
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.eventRepository = eventRepository;
    }

    async login(loginDTO) {
        const user = await this.userRepository.findByEmail(loginDTO.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (user.status === 'banned') {
            throw new Error('User is banned');
        }

        const isMatch = await bcrypt.compare(loginDTO.password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        
        
        
        

        if (user.two_factor_enabled) {
            
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); 

            await this.userRepository.update(user.id, {
                temp_2fa_code: code,
                temp_2fa_expires: expires
            });

            
            try {
                await this.mailService.sendMail(
                    user.email,
                    'Your 2FA Code - Corporate Event',
                    `Your verification code is: ${code}`,
                    `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2>Authentication Required</h2>
                        <p>Use the following code to complete your login:</p>
                        <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
                        <p>This code will expire in 10 minutes.</p>
                    </div>`
                );
            } catch (err) {
                console.error("Failed to send 2FA email:", err);
                
                
                throw new Error('Failed to send 2FA code. Please contact support.');
            }

            
            return { requires2fa: true, userId: user.id, message: '2FA code sent to email' };
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return new AuthResponseDTO(UserMapper.toDTO(user), token);
    }

    async register(registerUserDTO) {
        const existingUser = await this.userRepository.findByEmail(registerUserDTO.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(registerUserDTO.password, 10);

        
        const newUserModel = await this.userRepository.create({
            email: registerUserDTO.email,
            password: hashedPassword,
            name: registerUserDTO.name,
            role: registerUserDTO.role,
            status: 'active',
            custom_data: registerUserDTO.customData
        });

        return UserMapper.toDTO(newUserModel);
    }

    async verify2FA(userId, code) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        if (!user.temp_2fa_code || !user.temp_2fa_expires) {
            throw new Error('No 2FA session active');
        }

        if (new Date() > new Date(user.temp_2fa_expires)) {
            throw new Error('Code expired');
        }

        if (user.temp_2fa_code !== code) {
            throw new Error('Invalid code');
        }

        
        await this.userRepository.update(userId, {
            temp_2fa_code: null,
            temp_2fa_expires: null
        });

        
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return new AuthResponseDTO(UserMapper.toDTO(user), token);
    }

    async openAccess(email, name, customData = {}) {
        const settings = await this.eventRepository.getSettings();
        if (settings?.auth_mode !== 'open') {
            throw new Error('Open access is not enabled for this event');
        }

        if (!email || !name) {
            throw new Error('Email and Name are required');
        }

        let user = await this.userRepository.findByEmail(email);

        if (user) {
            if (user.status === 'banned') throw new Error('User is banned');
            // Update user
            user = await this.userRepository.update(user.id, {
                name,
                custom_data: { ...user.custom_data, ...customData }
            });
        } else {
            // Create user with a dummy password since it's required by the table
            const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = await this.userRepository.create({
                email,
                name,
                password: dummyPassword,
                role: 'user',
                status: 'active',
                custom_data: customData
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return new AuthResponseDTO(UserMapper.toDTO(user), token);
    }
}

module.exports = AuthService;
