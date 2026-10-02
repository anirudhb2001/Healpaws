import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["razorpay", "stripe"],
    required: true
  },
  paymentId: String,
  orderId: String,
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "pending"
  },
  paidAt: Date
});

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;
