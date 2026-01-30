
class IUserRepository {
    async findByEmail(email) { throw new Error('Not Implemented'); }
    async findById(id) { throw new Error('Not Implemented'); }
    async findAll() { throw new Error('Not Implemented'); }
    async create(userModel) { throw new Error('Not Implemented'); }
    async updateStatus(id, status) { throw new Error('Not Implemented'); } 
}

module.exports = IUserRepository;
