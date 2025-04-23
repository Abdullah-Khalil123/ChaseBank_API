const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        accountName: true,
        accountType: true,
        accountNumber: true,
        role: true,
        balance: true,
        availableCredit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        accountName: true,
        accountType: true,
        accountNumber: true,
        role: true,
        balance: true,
        availableCredit: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      accountName,
      accountType,
      accountNumber,
      role,
      balance,
      availableCredit,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already in use",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        accountName,
        accountType,
        accountNumber,
        role: role === "Admin" || role === true ? true : false,
        balance: parseFloat(balance) || 0,
        availableCredit: parseFloat(availableCredit) || 0,
      },
    });

    // Remove password from output
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error creating user",
      error: error.message,
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      password,
      phone,
      address,
      accountName,
      accountType,
      accountNumber,
      role,
      balance,
      availableCredit,
    } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (accountName) updateData.accountName = accountName;
    if (accountType) updateData.accountType = accountType;
    if (accountNumber) updateData.accountNumber = accountNumber;
    if (role !== undefined) updateData.role = role ? true : false;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (availableCredit !== undefined)
      updateData.availableCredit = parseFloat(availableCredit);

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Remove password from output
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
    });

    // Get total count
    const totalCount = await prisma.transaction.count({
      where: { userId: id },
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
