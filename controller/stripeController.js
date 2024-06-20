const stripe = require("../config/stripeConfig");
const bookingModel = require("../models/bookingModel");

const createCustomer = async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      name: req.body.name,
      email: req.body.email,
    });

    res.status(200).send(customer);
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const addNewCard = async (req, res) => {
  try {
    const {
      customer_id,
      card_Name,
      card_ExpYear,
      card_ExpMonth,
      card_Number,
      card_CVC,
    } = req.body;

    const card_token = await stripe.tokens.create({
      card: {
        name: card_Name,
        number: card_Number,
        exp_year: card_ExpYear,
        exp_month: card_ExpMonth,
        cvc: card_CVC,
      },
    });

    const card = await stripe.customers.createSource(customer_id, {
      source: `${card_token.id}`,
    });

    res.status(200).send({ card: card.id });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const createCharges = async (req, res) => {
  try {
    const { customer_id, card_id, packageType } = req.body;

    let amount;
    switch (packageType) {
      case "weekly":
        amount = 500; // Replace with your actual amount for weekly package
        break;
      case "monthly":
        amount = 2000; // Replace with your actual amount for monthly package
        break;
      case "bi-annually":
        amount = 10000; // Replace with your actual amount for bi-annual package
        break;
      case "annually":
        amount = 20000; // Replace with your actual amount for annual package
        break;
      default:
        return res.status(400).send("Invalid package type");
    }

    const createCharge = await stripe.charges.create({
      receipt_email: "tester@gmail.com",
      amount: amount * 100, // amount*100 to convert to smallest currency unit
      currency: "INR",
      source: card_id, // Use source instead of card
      customer: customer_id,
    });

    // Store booking data in the database
    const bookingData = {
      userId: req.body.userId,
      packageType,
      amount,
      paymentStatus: "Paid",
    };
    await bookingModel.createBooking(bookingData);

    res.status(200).send(createCharge);
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

module.exports = {
  createCustomer,
  addNewCard,
  createCharges,
};
