const { prisma } = require("../config/db");

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await prisma.transaction.count();

    res.status(200).json({
      status: "success",
      results: transactions.length,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            accountName: true,
            accountNumber: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  const { email, description, amount, type, date } = req.body;

  // Validate required fields
  if (!email || !type) {
    return res.status(400).json({
      status: "error",
      message: "Email and transaction type are required",
    });
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Validate and parse amount
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        throw new Error("Invalid amount");
      }

      // Calculate updated balance
      let updatedBalance = user.balance;
      switch (type) {
        case "credit":
        case "ach":
        case "wire":
          updatedBalance += amountValue;
          break;
        case "debit":
        case "fee":
          updatedBalance -= amountValue;
          break;
        case "other":
          updatedBalance += amountValue; // amount can be positive or negative
          break;
        default:
          throw new Error("Invalid transaction type");
      }

      // Create transaction
      const newTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          description,
          amount: amountValue,
          type,
          date: date ? new Date(date) : new Date(),
          updatedBalance,
        },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: updatedBalance },
      });

      return { newTransaction, updatedBalance, userId: user.id };
    });

    res.status(201).json({
      status: "success",
      data: {
        transaction: result.newTransaction,
        updatedBalance: result.updatedBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error creating transaction",
      error: error.message,
    });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, date } = req.body;

    // Find the transaction to update
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    // Get the user associated with the transaction
    const user = await prisma.user.findUnique({
      where: { id: transaction.userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Recalculate balances
    let newBalance = user.balance;
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" }, // Ensure transactions are sorted by date
    });

    let foundUpdatedTransaction = false;

    // Loop through all transactions and recalculate their balances
    for (let i = 0; i < allTransactions.length; i++) {
      const tx = allTransactions[i];

      // Update the specific transaction first if it's the one being updated
      if (tx.id === id) {
        const updatedAmount =
          amount !== undefined ? parseFloat(amount) : tx.amount;
        const updatedType = type !== undefined ? type : tx.type;
        const updatedDate = date ? new Date(date) : tx.date;

        // Update the transaction
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            description:
              description !== undefined ? description : tx.description,
            amount: updatedAmount,
            type: updatedType,
            date: updatedDate,
          },
        });

        // Recalculate balance for this transaction
        if (
          updatedType === "credit" ||
          updatedType === "ach" ||
          updatedType === "wire"
        ) {
          newBalance += updatedAmount;
        } else if (updatedType === "debit" || updatedType === "fee") {
          newBalance -= updatedAmount;
        } else if (updatedType === "other") {
          newBalance += updatedAmount; // Amount could be positive or negative
        }

        // Update balance in the updated transaction record
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            updatedBalance: newBalance,
          },
        });

        foundUpdatedTransaction = true;
      }

      // If the transaction has already been updated, recalculate subsequent balances
      if (foundUpdatedTransaction && tx.id !== id) {
        const amountToUpdate = tx.amount;
        const updatedBalance =
          tx.type === "credit" || tx.type === "ach" || tx.type === "wire"
            ? newBalance + amountToUpdate
            : tx.type === "debit" || tx.type === "fee"
            ? newBalance - amountToUpdate
            : newBalance + amountToUpdate; // 'other' type can be both positive or negative

        // Update the balance of subsequent transactions
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            updatedBalance: updatedBalance,
          },
        });

        // Update newBalance for the next transaction
        newBalance = updatedBalance;
      }
    }

    // Update the user's balance in the database after recalculating all transactions
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    res.status(200).json({
      status: "success",
      message: "Transaction updated and balances recalculated",
      data: { transactionId: id, updatedBalance: newBalance },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating transaction",
      error: error.message,
    });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (prisma) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
      });

      // Calculate updated balance
      let updatedBalance = user.balance;

      // Reverse the transaction effect
      if (
        transaction.type === "credit" ||
        transaction.type === "ach" ||
        transaction.type === "wire"
      ) {
        updatedBalance -= transaction.amount;
      } else if (transaction.type === "debit" || transaction.type === "fee") {
        updatedBalance += transaction.amount;
      } else {
        // For type 'other', reverse the effect
        updatedBalance -= transaction.amount;
      }

      // Delete transaction
      await prisma.transaction.delete({
        where: { id },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { balance: updatedBalance },
      });
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting transaction",
      error: error.message,
    });
  }
};

// Get transactions by user ID
exports.getTransactionsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const { limit = 10, page = 1 } = req.query;

    console.log("User ID:", req.params);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
    });

    // console.log("Transactions:", transactions);

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: {
        userId: userId,
      },
    });

    res.status(200).json({
      status: "success",
      results: transactions.length,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching user transactions",
      error: error.message,
    });
  }
};
