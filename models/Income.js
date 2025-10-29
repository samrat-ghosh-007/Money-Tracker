// models/Income.js
import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false, // true for system-created incomes
    },
  },
  { timestamps: true }
);

export default mongoose.model("Income", incomeSchema);
