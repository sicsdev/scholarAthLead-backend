const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');

router.get('/get-booking', bookingController.manageBooking);
router.get('/get-all-booking', bookingController.getAllBookings);


module.exports = router;
