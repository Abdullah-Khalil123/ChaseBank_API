/*
  Warnings:

  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ach_credit', 'ach_employee_payment', 'ach_vendor_payment', 'deposit', 'incoming_wire_transfer', 'misc_credit', 'refund', 'zelle_credit', 'ach_debit', 'atm_transaction', 'bill_payment', 'card', 'loan_payment', 'misc_debit', 'outgoing_wire_transfer', 'overnight_check', 'tax_payment', 'egift_debit', 'zelle_debit', 'account_transfer', 'adjustment_or_reversal', 'returned_deposit_item', 'checks_under_2_years', 'checks_over_2_years');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;
