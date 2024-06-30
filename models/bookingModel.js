const db = require("../config/bookingdb"); // Assuming you have a database configuration file
require('dotenv').config();
const transporter = require("../config/email.js"); 

const createBookingEmailTemplate = (userName, amount, scheduleTime, scheduleDate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #4CAF50;">Booking Confirmation</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for your payment. We are pleased to confirm your booking. Below are the details:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Schedule Date:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scheduleDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Schedule Time:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${scheduleTime}</td>
        </tr>
      </table>
      <p>If you have any questions or need further assistance, please feel free to contact us.</p>
      <p>Best regards,</p>
      <p>Your Company Name</p>
    </div>
  `;
};

const sendBookingEmail = async (userEmail, userName, amount, scheduleTime, scheduleDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Booking Confirmation',
    html: createBookingEmailTemplate(userName, amount, scheduleTime, scheduleDate)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const createBooking = async (
  userId,
  amount,
  paymentStatus,
  subscriptionId,
  customerId,
  userData
) => {
  // Check if booking with the given user ID exists
  const [rows] = await db.execute(
    "SELECT id, user_data FROM booking WHERE user_id = ?",
    [userId]
  );

  let result;
  let updatedUserData;
  if (rows.length > 0) {
    // If booking exists, update it
    let existingUserData = JSON.parse(rows[0].user_data);
    if (!Array.isArray(existingUserData)) {
      existingUserData = [];
    }
    existingUserData.push(userData);
    updatedUserData = existingUserData;
    [result] = await db.execute(
      "UPDATE booking SET amount = ?, status = ?, subscription_id = ?, customer_id = ?, user_data = ? WHERE user_id = ?",
      [amount, paymentStatus, subscriptionId, customerId, JSON.stringify(updatedUserData), userId]
    );
  } else {
    // If booking does not exist, insert a new one
    updatedUserData = [userData];
    [result] = await db.execute(
      "INSERT INTO booking (id, user_id, amount, status, subscription_id, customer_id, user_data) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
      [userId, amount, paymentStatus, subscriptionId, customerId, JSON.stringify(updatedUserData)]
    );
  }

  // Send booking confirmation email
  await sendBookingEmail(userData.email, userData.name, amount, userData.scheduleTime, userData.scheduleDate);

  return result;
};

const getBooking = async (userId) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, user_id, amount, status, subscription_id, customer_id, user_data, created_at FROM booking WHERE user_id = ?",
      [userId]
    );

    if (rows.length > 0) {
      return rows[0]; // Return the first booking found for the user
    } else {
      return null; // No booking found for the user
    }
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

module.exports = {
  createBooking,
  getBooking
};
