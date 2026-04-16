const db = require('./src/config/db');

const createSessionTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS session_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                socket_id VARCHAR(255),
                ip_address VARCHAR(45),
                entry_time TIMESTAMP DEFAULT NOW(),
                exit_time TIMESTAMP,
                duration INTEGER
            );
        `);
        console.log("Table session_logs created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
};

createSessionTable();
