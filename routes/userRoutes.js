// routes/formRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')

// Routes
router.get('/', (req, res) => {
    res.send('Welcome to the Form API');
});

router.post('/submit-form', userController.submitForm);
router.get('/forms', userController.getForms);

module.exports = router;
