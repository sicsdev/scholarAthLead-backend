const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root', // use your MySQL username
    password: '', // use your MySQL password
    database: 'ScholarAthLeadDB'
});

module.exports = db;
