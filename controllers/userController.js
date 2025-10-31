import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import { initDefaultAccounts } from "./accountController.js";
import { sendEmail } from "../utils/sendEmail.js"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

//  Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

//  Register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
    });

    // Send OTP email
    await sendEmail(email, "Verify your Smart Finance account", `Your OTP is ${otp}`);

    res.status(201).json({ message: "OTP sent to email. Please verify your account." });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "User already verified" });
    if (user.otp !== otp || user.otpExpires < Date.now())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Initialize categories & accounts now
    const defaultIncomes = [
      "Awards",
      "Coupons",
      "Grants",
      "Lottery",
      "Refunds",
      "Rental",
      "Salary",
      "Sell",
    ];

    const defaultExpenses = [
      "Baby",
      "Beauty",
      "Bills",
      "Car",
      "Clothing",
      "Education",
      "Electronics",
      "Entertainment",
      "Food",
      "Health",
      "Home",
      "Insurance",
      "Shopping",
      "Social",
      "Sport",
      "Tax",
      "Telephone",
      "Transportation",
    ];

    // ✅ Convert strings to objects before insert
    const incomeDocs = defaultIncomes.map((name) => ({
      userId: user._id,
      name,
      isDefault: true,
    }));

    const expenseDocs = defaultExpenses.map((name) => ({
      userId: user._id,
      name,
      isDefault: true,
    }));

    await Income.insertMany(incomeDocs);
    await Expense.insertMany(expenseDocs);

    await initDefaultAccounts(user._id);
    const token = generateToken(user._id);
    res.json({ message: "Account verified successfully", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

//RESEND OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(email, "Your new OTP", `Your new OTP is ${otp}`);
    res.json({ message: "New OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to resend OTP" });
  }
};


//  Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


//FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(email, "Password Reset OTP", `Your OTP for resetting password is ${otp}`);
    res.json({ message: "OTP sent for password reset" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reset OTP" });
  }
};


//RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    user.password = newPassword; // triggers pre-save bcrypt hash
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
};




//  Get current user
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


// DELETE USER AND ALL THEIR ACCOUNTS
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware

    // Delete all accounts related to this user
    await Account.deleteMany({ userId });


    await Transaction.deleteMany({ userId });
    await Income.deleteMany({ userId });
    await Expense.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: "User and all associated accounts deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

