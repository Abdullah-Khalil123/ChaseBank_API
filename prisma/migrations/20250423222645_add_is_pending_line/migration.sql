/*
  Warnings:

  - Added the required column `isPending` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isPending" BOOLEAN NOT NULL;
