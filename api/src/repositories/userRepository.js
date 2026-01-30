const IUserRepository = require('../interfaces/IUserRepository');
const db = require('../config/db');
const UserMapper = require('../mappings/UserMapper');

class UserRepository extends IUserRepository {
    async findByEmail(email) {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return UserMapper.toDomain(result.rows[0]);
    }

    async findById(id) {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return UserMapper.toDomain(result.rows[0]);
    }

    async findAll() {
        const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows.map(row => UserMapper.toDomain(row));
    }

    async create(userData) {
        const result = await db.query(
            'INSERT INTO users (email, password, name, role, status, custom_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userData.email, userData.password, userData.name, userData.role || 'user', userData.status || 'active', userData.custom_data || {}]
        );
        return UserMapper.toDomain(result.rows[0]);
    }

    async update(id, updates) {
        const keys = Object.keys(updates);
        if (keys.length === 0) return this.findById(id);

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(updates)];

        const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;

        const result = await db.query(query, values);
        return UserMapper.toDomain(result.rows[0]);
    }

    async updateStatus(id, status) {
        return this.update(id, { status });
    }
}

module.exports = UserRepository;
