
const db = require("../config/bookingdb"); // Assuming you have a database configuration file

require('dotenv').config();
const updatePaymentStatus = async (userId, status) => {
  const query = 'UPDATE users SET payment_status = ? WHERE id = ?';
  const values = [status, userId];
  return db.query(query, values);
};

module.exports = {
  updatePaymentStatus,
};
