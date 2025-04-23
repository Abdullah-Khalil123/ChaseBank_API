const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const {
      name,
      username,
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

    // Check if user already exists (by username or email)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already in use",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
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

    // Create token
    const token = signToken(newUser.id);

    // Remove password from output
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide username and password",
      });
    }

    // Check if user exists && password is correct
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect username or password",
      });
    }

    // Generate token
    const token = signToken(user.id);

    // Remove password from output
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching current user",
      error: error.message,
    });
  }
};
