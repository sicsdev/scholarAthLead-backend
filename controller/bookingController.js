const bookingModel = require("../models/bookingModel")
const manageBooking = async (req, res) => {
    const { userId } = req.query;
  
    try {
      const bookingDetails = await bookingModel.getBooking(userId);
  
      res.status(200).send({ success: true, booking: bookingDetails });
    } catch (error) {
      res.status(500).send({ success: false, msg: 'Error managing booking', error });
    }
  };
  

  module.exports = {
    manageBooking,
  };