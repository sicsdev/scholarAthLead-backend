const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.registerAdmin = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const checkDuplicateSql = 'SELECT * FROM Admins WHERE email = ? OR username = ?';
    db.query(checkDuplicateSql, [email, username], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking for duplicate admin' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO Admins (
                username,
                email,
                password
            ) VALUES (?, ?, ?)
        `;

        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error saving admin data' });
            }
            res.status(201).json({ message: 'Admin registered successfully' });
        });
    });
};

exports.loginAdmin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const sql = 'SELECT * FROM Admins WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking admin credentials' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const admin = results[0];

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    });
};
