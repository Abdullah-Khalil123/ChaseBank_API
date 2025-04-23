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
  .get(transactionController.getTransactionsByUserId)
  .patch(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

router
  .route("/getTransactionById/:id")
  .get(transactionController.getTransactionById);

module.exports = router;
