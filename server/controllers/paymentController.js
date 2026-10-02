import Razorpay from "razorpay";
import crypto from "crypto";
import Stripe from "stripe";

import Consultation from "../models/Consultation.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

// Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// -----------------------
// CREATE RAZORPAY ORDER
// -----------------------
export const createRazorpayOrder = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    if (!appointmentId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const appointment = await Consultation.findById(appointmentId)
      .populate("ownerId", "name email phone");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.isPaid) {
      return res.status(400).json({ message: "Appointment already paid" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${appointmentId}_${Date.now()}`,
      notes: {
        appointmentId,
        petName: appointment.petId?.name || "N/A",
        vetName: appointment.vetId?.name || "N/A"
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      userName: appointment.ownerId?.name,
      userEmail: appointment.ownerId?.email,
      userPhone: appointment.ownerId?.phone
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// -----------------------
// VERIFY RAZORPAY PAYMENT
// -----------------------
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      appointmentId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const appointment = await Consultation.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const payment = new Payment({
      appointmentId,
      ownerId: appointment.ownerId,
      vetId: appointment.vetId,
      amount: appointment.consultationFee + 50,
      paymentMethod: "razorpay",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "success",
      paidAt: new Date()
    });

    await payment.save();

    appointment.isPaid = true;
    appointment.paymentId = payment._id;
    await appointment.save();

    res.json({
      message: "Payment verified successfully",
      payment
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// -----------------------
// CREATE STRIPE SESSION
// -----------------------
export const createStripeSession = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    const appointment = await Consultation.findById(appointmentId)
      .populate("ownerId", "name email")
      .populate("petId", "name")
      .populate("vetId", "name");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.isPaid) {
      return res.status(400).json({ message: "Appointment already paid" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Veterinary Consultation",
              description: `Consultation for ${appointment.petId?.name} with Dr. ${appointment.vetId?.name}`
            },
            unit_amount: amount * 100
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointmentId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?appointment_id=${appointmentId}`,
      customer_email: appointment.ownerId?.email,
      metadata: { appointmentId }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session creation error:", err);
    res.status(500).json({ message: "Failed to create payment session" });
  }
};

// -----------------------
// STRIPE WEBHOOK
// -----------------------
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const appointmentId = session.metadata.appointmentId;

    const appointment = await Consultation.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    const payment = new Payment({
      appointmentId,
      ownerId: appointment.ownerId,
      vetId: appointment.vetId,
      amount: session.amount_total / 100,
      paymentMethod: "stripe",
      paymentId: session.payment_intent,
      orderId: session.id,
      status: "success",
      paidAt: new Date()
    });

    await payment.save();

    appointment.isPaid = true;
    appointment.paymentId = payment._id;
    await appointment.save();
  }

  res.json({ received: true });
};

// -----------------------
// GET PAYMENT DETAILS
// -----------------------
export const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      appointmentId: req.params.appointmentId
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ payment });
  } catch (err) {
    console.error("Get payment details error:", err);
    res.status(500).json({ message: "Failed to fetch payment details" });
  }
};
