import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
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
    initialBalance:{
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
