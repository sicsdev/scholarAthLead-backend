const bookingModel = require("../models/bookingModel")
const db = require('../config/db');
const manageBooking = async (req, res) => {
    const { userId } = req.query;
  
    try {
      const bookingDetails = await bookingModel.getBooking(userId);
  
      res.status(200).send({ success: true, booking: bookingDetails });
    } catch (error) {
      res.status(500).send({ success: false, msg: 'Error managing booking', error });
    }
  };

  const getAllBookings = (req, res) => {
    const sql = "SELECT * FROM booking";
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching form data" });
      }
      res.json(results);
    });
  };

  module.exports = {
    manageBooking,
    getAllBookings
  };