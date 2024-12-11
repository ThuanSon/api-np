const mysql = require("mysql2");
require('dotenv').config();

let db;

function connectToDatabase() {
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    db.connect((err) => {
        if (err) {
            console.error("Error connecting to MySQL:", err.stack);
            setTimeout(connectToDatabase, 5000); // Retry after 5 seconds
        } else {
            console.log("Connected to MySQL database np");
        }
    });

    db.on('error', (err) => {
        console.error('MySQL error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connectToDatabase(); // Reconnect if connection is lost
        }
    });
}

connectToDatabase();

module.exports = db;
