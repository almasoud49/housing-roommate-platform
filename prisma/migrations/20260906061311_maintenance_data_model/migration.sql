/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `flatId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_VENDOR', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'VIEWING_REQUESTED', 'VIEWING_CONFIRMED', 'VIEWING_CANCELLED', 'RENT_DUE', 'RENT_OVERDUE', 'RENT_PAID', 'MAINTENANCE_CREATED', 'MAINTENANCE_UPDATED', 'MAINTENANCE_RESOLVED', 'UTILITY_BILL_CREATED', 'UTILITY_BILL_DUE', 'DOCUMENT_SIGNED', 'DOCUMENT_EXPIRING', 'ROOMMATE_MATCH', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "RentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LEASE_AGREEMENT', 'MOVE_IN_CHECKLIST', 'MOVE_OUT_CHECKLIST', 'ID_DOCUMENT', 'INCOME_PROOF', 'REFERENCE_LETTER', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'INTERESTED', 'CONNECTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'TRASH', 'OTHER');

-- CreateEnum
CREATE TYPE "UtilityBillStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ViewingRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PROPERTY_MANAGER';

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_propertyId_fkey";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "isAvailable",
DROP COLUMN "propertyId",
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "flatId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "verificationDocs" TEXT[],
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "floors" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "flatNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Flat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "assignedTo" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "bkashPaymentId" TEXT,
    "bkashCreateResponse" JSONB,
    "bkashExecuteResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommatePreference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "preferredCities" TEXT[],
    "preferredAreas" TEXT[],
    "lifestyle" TEXT,
    "cleanlinessLevel" INTEGER,
    "noiseTolerance" INTEGER,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "guestsFrequency" TEXT,
    "workSchedule" TEXT,
    "moveInDate" TIMESTAMP(3),
    "leaseDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommatePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "RentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateMatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "matchedWithId" TEXT NOT NULL,
    "roomId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityBill" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" "UtilityType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "billingPeriod" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "UtilityBillStatus" NOT NULL DEFAULT 'PENDING',
    "billUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityBillSplit" (
    "id" TEXT NOT NULL,
    "utilityBillId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "UtilityBillStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtilityBillSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyViewingRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "status" "ViewingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyViewingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flat_buildingId_flatNumber_key" ON "Flat"("buildingId", "flatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_applicationId_key" ON "Payment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bkashPaymentId_key" ON "Payment"("bkashPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommatePreference_profileId_key" ON "RoommatePreference"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Rent_applicationId_key" ON "Rent"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateMatch_tenantId_matchedWithId_key" ON "RoommateMatch"("tenantId", "matchedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "UtilityBillSplit_utilityBillId_tenantId_key" ON "UtilityBillSplit"("utilityBillId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flat" ADD CONSTRAINT "Flat_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommatePreference" ADD CONSTRAINT "RoommatePreference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalDocument" ADD CONSTRAINT "RentalDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateMatch" ADD CONSTRAINT "RoommateMatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateMatch" ADD CONSTRAINT "RoommateMatch_matchedWithId_fkey" FOREIGN KEY ("matchedWithId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateMatch" ADD CONSTRAINT "RoommateMatch_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBill" ADD CONSTRAINT "UtilityBill_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillSplit" ADD CONSTRAINT "UtilityBillSplit_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "UtilityBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillSplit" ADD CONSTRAINT "UtilityBillSplit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyViewingRequest" ADD CONSTRAINT "PropertyViewingRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyViewingRequest" ADD CONSTRAINT "PropertyViewingRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
