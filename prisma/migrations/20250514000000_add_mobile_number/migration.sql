-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN "mobileNumber" TEXT;
ALTER TABLE "PatientProfile" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
