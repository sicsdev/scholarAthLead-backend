// routes/formRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')
const stripeController = require('../controller/stripeController')

// Routes
router.get('/', (req, res) => {
    res.send('Welcome to the Form API');
});

router.post('/submit-form', userController.submitForm);
router.put('/submit-form/:email', userController.updateForm);
router.post('/create-customer', stripeController.createCustomer);
router.post('/create-card', stripeController.addNewCard);

router.post('/create-payment', stripeController.createCharges);


router.get('/forms', userController.getForms);

module.exports = router;
