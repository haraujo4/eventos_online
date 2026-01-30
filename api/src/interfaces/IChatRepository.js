
class IChatRepository {
    async create(messageModel) { throw new Error('Not Implemented'); }
    async findRecent(limit) { throw new Error('Not Implemented'); }
    async delete(id) { throw new Error('Not Implemented'); }
}

module.exports = IChatRepository;
