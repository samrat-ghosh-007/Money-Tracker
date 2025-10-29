import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import { initDefaultAccounts } from "./accountController.js";
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

    const user = await User.create({ name, email, password });

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

    // Insert defaults linked to user
    const incomeDocs = defaultIncomes.map((item) => ({
      userId: user._id,
      name: item,
      isDefault: true,
    }));

    await Income.insertMany(incomeDocs);
    await Expense.insertMany(defaultExpenses.map((n) => ({ userId: user._id, name: n, isDefault: true })));



    await initDefaultAccounts(user._id);

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Server error" });
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

