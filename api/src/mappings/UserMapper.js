const User = require('../models/User');
const { UserResponseDTO } = require('../dtos/UserDTOs');

class UserMapper {
    static toDomain(dbRow) {
        if (!dbRow) return null;
        return new User(
            dbRow.id,
            dbRow.email,
            dbRow.password,
            dbRow.name,
            dbRow.role,
            dbRow.status || 'active', 
            dbRow.created_at,
            dbRow.custom_data || {}
        );
    }

    static toDTO(userModel) {
        if (!userModel) return null;
        return new UserResponseDTO(userModel);
    }
}

module.exports = UserMapper;
