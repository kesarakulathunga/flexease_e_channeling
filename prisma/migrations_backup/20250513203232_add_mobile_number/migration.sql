/*
  Warnings:

  - You are about to drop the column `mobileNumber` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PatientProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientProfile" DROP COLUMN "mobileNumber",
DROP COLUMN "updatedAt";
