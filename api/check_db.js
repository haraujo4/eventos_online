require('dotenv').config();
const db = require('./src/config/db');

async function check() {
    try {
        console.log("Checking streams table columns...");
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'streams'");
        console.log("Columns found:");
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        process.exit(0);
    } catch (err) {
        console.error("Error checking DB:", err);
        process.exit(1);
    }
}

check();
