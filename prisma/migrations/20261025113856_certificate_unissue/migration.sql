-- AlterEnum
ALTER TYPE "CertificateStatus" ADD VALUE 'VOIDED';

-- AlterTable
ALTER TABLE "certificate" ADD COLUMN     "voidedAt" TIMESTAMP(3);
