const express = require('express');
const router = express.Router();
const availabilityController = require('../controller/availabilityController');

router.post('/set-availability', availabilityController.setAvailability);
router.get('/get-availability', availabilityController.getAvailability);

module.exports = router;
