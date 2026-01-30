const UserMapper = require('../mappings/UserMapper');
const db = require('../config/db');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(user => UserMapper.toDTO(user));
    }

    async updateUserStatus(id, status) {
        if (!['active', 'banned'].includes(status)) {
            throw new Error('Invalid status');
        }
        const user = await this.userRepository.updateStatus(id, status);
        return UserMapper.toDTO(user);
    }

    async createUser(userData) {
        if (!userData.email || !userData.name || !userData.password) {
            throw new Error('Missing required fields');
        }

        const existing = await this.userRepository.findByEmail(userData.email);
        if (existing) {
            throw new Error('User already exists');
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const newUser = await this.userRepository.create({
            ...userData,
            password: hashedPassword,
            role: userData.role || 'user',
            status: userData.status || 'active',
            custom_data: userData.custom_data || {}
        });

        return UserMapper.toDTO(newUser);
    }

    async updateUser(id, updates) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const updateData = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.email) updateData.email = updates.email; 
        if (updates.role) updateData.role = updates.role;
        if (updates.status) updateData.status = updates.status;
        if (updates.custom_data) updateData.custom_data = updates.custom_data; 

        if (updates.password) {
            const bcrypt = require('bcrypt');
            updateData.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = await this.userRepository.update(id, updateData);
        return UserMapper.toDTO(updatedUser);
    }

    async importUsers(usersData) {
        const results = { success: 0, failed: 0, errors: [], createdUsers: [] };
        
        
        
        
        
        
        

        const bcrypt = require('bcrypt');
        const SALT_ROUNDS = 10;

        for (const rawData of usersData) {
            try {
                
                const { name, email, password, role, status, ...rest } = rawData;

                
                if (!email || !name) {
                    throw new Error('Missing email or name');
                }

                
                const existing = await this.userRepository.findByEmail(email);
                if (existing) {
                    throw new Error('User already exists');
                }

                const userPassword = password || '12345678'; 
                const hashedPassword = await bcrypt.hash(String(userPassword), SALT_ROUNDS);

                await this.userRepository.create({
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'user',
                    status: 'active',
                    custom_data: rest 
                });
                results.success++;
                results.createdUsers.push({ name, email });
            } catch (err) {
                results.failed++;
                results.errors.push({ email: rawData.email, error: err.message });
            }
        }
        return results;
    }
    async getImportTemplate() {
        const xlsx = require('xlsx');

        
        const fieldsResult = await db.query('SELECT field_name, label FROM auth_fields ORDER BY display_order ASC');
        const customFields = fieldsResult.rows;

        
        
        const headers = ['name', 'email', 'password', ...customFields.map(f => f.field_name)];

        
        const wb = xlsx.utils.book_new();
        
        const ws = xlsx.utils.aoa_to_sheet([headers]);

        xlsx.utils.book_append_sheet(wb, ws, 'Users Template');
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
}

module.exports = UserService;
