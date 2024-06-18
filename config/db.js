// db.js
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // use your MySQL username
    password: '', // use your MySQL password
    database: 'test'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

module.exports = db;
