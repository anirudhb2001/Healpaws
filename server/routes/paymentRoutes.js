import express from "express";

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripeSession,
  stripeWebhook,
  getPaymentDetails
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);

router.post("/create-stripe-session", createStripeSession);

// Stripe webhook must use raw body (same in ESM)
router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.get("/:appointmentId", getPaymentDetails);

export default router;
