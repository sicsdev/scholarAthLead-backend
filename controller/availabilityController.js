const db = require('../config/db');

exports.setAvailability = (req, res) => {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
        return res.status(400).json({ error: 'Availability should be an array and is required' });
    }

    const sql = 'INSERT INTO Availability (date, start_time, end_time) VALUES ?';

    const values = availability.map(slot => [slot.date, slot.start_time, slot.end_time]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error setting availability' });
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
