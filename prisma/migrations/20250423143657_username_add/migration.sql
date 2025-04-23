/*
  Warnings:

  - You are about to drop the `Statement` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Statement" DROP CONSTRAINT "Statement_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "Statement";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
