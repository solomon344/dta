-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('NEW', 'CONTACTED', 'ENROLLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "waitlist_entry" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneDigits" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT,
    "programId" TEXT,
    "note" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'NEW',
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_studentId_key" ON "waitlist_entry"("studentId");

-- CreateIndex
CREATE INDEX "waitlist_entry_status_createdAt_idx" ON "waitlist_entry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "waitlist_entry_phoneDigits_idx" ON "waitlist_entry"("phoneDigits");

-- CreateIndex
CREATE INDEX "waitlist_entry_ipHash_createdAt_idx" ON "waitlist_entry"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
