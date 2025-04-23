const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Banking API is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong on the server",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export the app for testing

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// FILE: config/db.js
// FILE: middleware/authMiddleware.js

// FILE: controllers/authController.js
// FILE: controllers/userController.js

// FILE: controllers/transactionController.js
// FILE: routes/authRoutes.js

// FILE: routes/userRoutes.js

// FILE: routes/transactionRoutes.js

// FILE: utils/validation.js

// FILE: .env (example - create this file in the root directory)
// DATABASE_URL="postgresql://username:password@localhost:5432/bankingdb"
// JWT_SECRET="your-secret-key"
// JWT_EXPIRES_IN="30d"
// PORT=5000
// NODE_ENV="development"

// File structure:
// - server.js (main entry point)
// - config/
//   - db.js (database connection)
// - controllers/
//   - authController.js
//   - userController.js
//   - transactionController.js
// - middleware/
//   - authMiddleware.js
// - routes/
//   - authRoutes.js
//   - userRoutes.js
//   - transactionRoutes.js
// - utils/
//   - validation.js

// FILE: server.js
