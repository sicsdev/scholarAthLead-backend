const db = require("../config/bookingdb"); // Assuming you have a database configuration file

const createBooking = async (
  userId,
  amount,
  paymentStatus,
  subscriptionId,
  customerId
) => {
  // Check if booking with the given user ID exists
  const [rows] = await db.execute(
    "SELECT id FROM booking WHERE user_id = ?",
    [userId]
  );

  if (rows.length > 0) {
    // If booking exists, update it
    const [result] = await db.execute(
      "UPDATE booking SET amount = ?, status = ?, subscription_id = ?, customer_id = ? WHERE user_id = ?",
      [amount, paymentStatus, subscriptionId, customerId, userId]
    );
    return result;
  } else {
    // If booking does not exist, insert a new one
    const [result] = await db.execute(
      "INSERT INTO booking (id, user_id, amount, status, subscription_id, customer_id) VALUES (NULL, ?, ?, ?, ?, ?)",
      [userId, amount, paymentStatus, subscriptionId, customerId]
    );
    return result;
  }
};

module.exports = {
  createBooking,
};
