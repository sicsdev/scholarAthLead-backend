// models/bookingModel.js
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db'); // Assuming you have a database configuration file

const getConnection = async () => {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
};

const createBooking = async (userId, package, amount, paymentStatus) => {
  const connection = await getConnection();
  const [result] = await connection.execute(
    'INSERT INTO bookingSchema (user_id, package, amount, payment_status) VALUES (?, ?, ?, ?)',
    [userId, package, amount, paymentStatus]
  );
  await connection.end();
  return result;
};

module.exports = {
  createBooking,
};
