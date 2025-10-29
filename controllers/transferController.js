// controllers/transactionController.js
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

export const transferMoney = async (req, res) => {
  try {
    const userId = req.user; // from JWT middleware
    const { fromAccountId, toAccountId, amount } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: "Cannot transfer to same account" });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Deduct from source
    fromAccount.balance -= amount;
    await fromAccount.save();

    // Add to destination
    toAccount.balance += amount;
    await toAccount.save();

    // Record transfer as transaction

    await Transaction.create({
      userId,
      fromAccountId: fromAccountId,
      toAccountId: toAccountId,
      title: `Transfer from ${toAccount.name}`,
      amount,
      type: "transfer",
      date: new Date(),
    });

    res.status(200).json({
      message: "Transfer successful",
      fromAccount,
      toAccount,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
