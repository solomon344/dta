-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "certificateId" TEXT,
    "ipHash" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonial_status_createdAt_idx" ON "testimonial"("status", "createdAt");

-- CreateIndex
CREATE INDEX "testimonial_ipHash_createdAt_idx" ON "testimonial"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
