class User {
    constructor(id, email, password, name, role, status, createdAt, customData = {}) {
        this.id = id;
        this.email = email;
        this.password = password; 
        this.name = name;
        this.role = role;
        this.status = status || 'active'; 
        this.createdAt = createdAt;
        this.customData = customData;
    }
}

module.exports = User;
