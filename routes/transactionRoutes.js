const express = require("express");
const transactionController = require("../controllers/transactionController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes after this middleware
// router.use(protect);

router
  .route("/")
  .get(transactionController.getAllTransactions)
  .post(transactionController.createTransaction);

router
  .route("/:id")
  .get(transactionController.getTransactionById)
  .patch(restrictTo(), transactionController.updateTransaction)
  .delete(restrictTo(), transactionController.deleteTransaction);

module.exports = router;
