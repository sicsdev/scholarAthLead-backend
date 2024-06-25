const stripe = require("../config/stripeConfig");
const bookingModel = require("../models/bookingModel"); // Make sure to import the booking model

const createCustomer = async (req, res) => {
  try {
    const { name, email, token, address } = req.body;

    // Create a new customer
    const customer = await stripe.customers.create({
      name,
      email,
      address,
    });

    // Attach payment method to the customer
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token },
      billing_details: {
        name,
        email,
        address,
      },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    // Set the default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    res.status(200).send({ success: true, customer });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const createSubscription = async (req, res) => {
  try {
    const { customerId, priceId, userId,  amount, status,schedule_date, schedule_time } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const { latest_invoice } = subscription;
    const { payment_intent } = latest_invoice;

    // Save the booking with subscription and customer ID

    const bookingResult = await bookingModel.createBooking(
      userId,
      amount,
      status,
      subscription.id,
      customerId,
      schedule_time,
      schedule_date
    );
    console.log("bookingResult", bookingResult)

    res.status(200).send({ success: true, subscription, payment_intent, booking: bookingResult });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    res.status(200).send({ success: true, canceledSubscription });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription
};
