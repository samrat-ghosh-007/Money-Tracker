import Account from "../models/Account.js";
import User from "../models/User.js";

// 🔹 Create default accounts when user first accesses accounts
export const initDefaultAccounts = async (userId) => {
  try {
    const defaults = [
      { name: "Cash", balance: 0 },
      { name: "Card", balance: 0 },
      { name: "Savings", balance: 0 },
    ];

    // Insert accounts only if not already existing
    for (const acc of defaults) {
      const exists = await Account.findOne({ userId, name: acc.name });
      if (!exists) {
        await Account.create({ userId, name: acc.name, balance: acc.balance });
      }
    }

    console.log(`✅ Default accounts created for user ${userId}`);
  } catch (error) {
    console.error("Init accounts error:", error);
  }
};

// 🧾 Get all accounts for the user
export const getAccounts = async (req, res) => {
  try {
    const userId = req.user;
    const accounts = await Account.find({ userId });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ✏️ Update balance of an account (default or custom)



export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { initialBalance } = req.body;
    const userId = req.user; // from JWT middleware

    // Find the existing account
    const account = await Account.findOne({ _id: id, userId });
    
    // Update balance by adding the new initialBalance amount
    account.balance += Number(initialBalance);

    // Also, if you want to store the latest initialBalance value separately:
    account.initialBalance = Number(initialBalance);

    await account.save();

    // Recalculate the user's overall balance
    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Update user's overall balance
    await User.findByIdAndUpdate(userId, { overallBalance: total });

    res.json({
      message: "Account balance updated successfully",
      updatedAccount: account,
      overallBalance: total,
    });
  } catch (err) {
    console.error("Update Account Error:", err);
    res.status(400).json({ error: "Failed to update account" });
  }
};

// ➕ Add extra custom card
export const addCard = async (req, res) => {
  try {
    const userId = req.user;
    const { name, balance } = req.body;

    const newCard = await Account.create({
      userId,
      name: name || "CustomCard",
      balance: balance || 0
    });

    // Recalculate the user's total balance
    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Update user's overall balance
    await User.findByIdAndUpdate(userId, { overallBalance: total });

    res.status(201).json(newCard);
  } catch (err) {
    res.status(400).json({ error: "Failed to add new card" });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params; // account ID to delete
    const userId = req.user; // from JWT middleware

    // Find the account first
    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Delete the account
    await Account.findByIdAndDelete(id);

    // Recalculate overall balance
    const accounts = await Account.find({ userId });
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Update user's overall balance
    await User.findByIdAndUpdate(userId, { overallBalance: total });

    res.json({
      message: "Account deleted successfully",
      overallBalance: total,
    });
  } catch (err) {
    console.error("Delete Account Error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};






