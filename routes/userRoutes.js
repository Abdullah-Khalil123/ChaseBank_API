const express = require("express");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes after this middleware
// router.use(protect);

// Admin only routes
router
  .route("/")
  .get(userController.getAllUsers)
  .post(restrictTo(), userController.createUser);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(restrictTo(), userController.deleteUser);

router.get("/:id/transactions", userController.getUserTransactions);

module.exports = router;
