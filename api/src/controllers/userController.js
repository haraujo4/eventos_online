class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    async getAll(req, res) {
        try {
            const users = await this.userService.getAllUsers();
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const user = await this.userService.updateUserStatus(id, status);
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async create(req, res) {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json(user);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const user = await this.userService.updateUser(id, req.body);
            res.json(user);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async importUsers(req, res) {
        try {
            if (!req.file) {
                
                if (req.body.users) {
                    const results = await this.userService.importUsers(req.body.users);
                    return res.json(results);
                }
                return res.status(400).json({ message: 'No file uploaded' });
            }

            let users = [];
            
            const fileBuffer = req.file.buffer;

            if (req.file.mimetype.includes('spreadsheet') || req.file.mimetype.includes('excel') || req.file.originalname.endsWith('.xlsx')) {
                const xlsx = require('xlsx');
                const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                users = xlsx.utils.sheet_to_json(sheet);
            } else if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
                users = JSON.parse(fileBuffer.toString());
            } else {
                return res.status(400).json({ message: 'Invalid file format. Use .xlsx or .json' });
            }

            
            

            if (!Array.isArray(users)) {
                return res.status(400).json({ message: 'File content must be an array of users' });
            }

            const results = await this.userService.importUsers(users);
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }

    async exportUsers(req, res) {
        try {
            const users = await this.userService.getAllUsers();

            
            const data = users.map(u => {
                const { password, ...rest } = u; 
                
                const custom = u.custom_data || {};
                return { ...rest, ...custom, custom_data: undefined };
            });

            const xlsx = require('xlsx');
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(data);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

            const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error exporting users' });
        }
    }

    async downloadTemplate(req, res) {
        try {
            const buffer = await this.userService.getImportTemplate();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=import_template.xlsx');
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error generating template' });
        }
    }
}

module.exports = UserController;
