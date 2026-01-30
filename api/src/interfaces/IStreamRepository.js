
class IStreamRepository {
    async findAll() { throw new Error('Not Implemented'); }
    async findById(id) { throw new Error('Not Implemented'); }
    async create(streamModel) { throw new Error('Not Implemented'); }
    async update(id, streamModel) { throw new Error('Not Implemented'); }
    async delete(id) { throw new Error('Not Implemented'); }
}

module.exports = IStreamRepository;
