-- CreateEnum
CREATE TYPE "PartialStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "partial_hafalan" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "teacherId" TEXT,
    "kacaId" TEXT NOT NULL,
    "ayatNumber" INTEGER NOT NULL,
    "progress" TEXT NOT NULL,
    "percentage" INTEGER,
    "tanggalSetor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PartialStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "catatan" TEXT,
    "completedInRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partial_hafalan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partial_hafalan_santriId_kacaId_ayatNumber_status_idx" ON "partial_hafalan"("santriId", "kacaId", "ayatNumber", "status");

-- CreateIndex
CREATE INDEX "partial_hafalan_status_idx" ON "partial_hafalan"("status");

-- AddForeignKey
ALTER TABLE "partial_hafalan" ADD CONSTRAINT "partial_hafalan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partial_hafalan" ADD CONSTRAINT "partial_hafalan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partial_hafalan" ADD CONSTRAINT "partial_hafalan_kacaId_fkey" FOREIGN KEY ("kacaId") REFERENCES "kaca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partial_hafalan" ADD CONSTRAINT "partial_hafalan_completedInRecordId_fkey" FOREIGN KEY ("completedInRecordId") REFERENCES "hafalan_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
