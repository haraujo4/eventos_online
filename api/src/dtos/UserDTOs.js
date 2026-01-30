class LoginDTO {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
}

class RegisterUserDTO {
    constructor(email, password, name, role, customData = {}) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.customData = customData;
    }
}

class UserResponseDTO {
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name;
        this.role = user.role;
        this.status = user.status;
        this.custom_data = user.customData;
    }
}

class AuthResponseDTO {
    constructor(userResponseDTO, token) {
        this.user = userResponseDTO;
        this.token = token;
    }
}

module.exports = {
    LoginDTO,
    RegisterUserDTO,
    UserResponseDTO,
    AuthResponseDTO
};
