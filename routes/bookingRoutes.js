const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');

router.get('/get-booking', bookingController.manageBooking);

module.exports = router;
