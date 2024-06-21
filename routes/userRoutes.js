// routes/formRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const stripeController = require("../controller/stripeController");

// Routes
router.get("/", (req, res) => {
  res.send("Welcome to the Form API");
});

router.post("/submit-form", userController.submitForm);

router.post("/create-customer", stripeController.createCustomer);
router.post("/create-payment", stripeController.createSubscription);
router.post("/cancel-subscription", stripeController.cancelSubscription);






router.get("/forms", userController.getForms);

module.exports = router;
