const db = require('../config/db');

exports.setAvailability = (req, res) => {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
        return res.status(400).json({ error: 'Availability should be an array and is required' });
    }

    const sql = 'INSERT INTO Availability (start_end_time) VALUES ?';

    const values = availability.map(item => [JSON.stringify({ date: item.date, slots: item.times })]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Availability set successfully' });
    });
};  

exports.getAvailability = (req, res) => {
    const sql = 'SELECT * FROM Availability';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving availability:', err);
            return res.status(500).json({ error: 'Error retrieving availability', details: err.message });
        }
        res.json(results);
    });
};
