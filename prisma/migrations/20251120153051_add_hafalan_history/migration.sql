-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'SANTRI', 'WALI');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "KacaStatus" AS ENUM ('PROGRESS', 'COMPLETE_WAITING_RECHECK', 'RECHECK_PASSED');

-- CreateEnum
CREATE TYPE "AyatStatus" AS ENUM ('ULANG', 'LANJUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SANTRI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wali_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "occupation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wali_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "santri_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nis" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "gender" "Gender",
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT,
    "waliId" TEXT,

    CONSTRAINT "santri_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "santri_teacher_assignments" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "santri_teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaca" (
    "id" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "surahName" TEXT NOT NULL,
    "ayatStart" INTEGER NOT NULL,
    "ayatEnd" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "kaca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_records" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "kacaId" TEXT NOT NULL,
    "tanggalSetor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedVerses" TEXT NOT NULL DEFAULT '[]',
    "statusKaca" "KacaStatus" NOT NULL DEFAULT 'PROGRESS',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hafalan_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_ayat_statuses" (
    "id" TEXT NOT NULL,
    "hafalanRecordId" TEXT NOT NULL,
    "ayatNumber" INTEGER NOT NULL,
    "status" "AyatStatus" NOT NULL DEFAULT 'ULANG',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hafalan_ayat_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hafalan_history" (
    "id" TEXT NOT NULL,
    "hafalanRecordId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedVerses" TEXT NOT NULL DEFAULT '[]',
    "catatan" TEXT,

    CONSTRAINT "hafalan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recheck_records" (
    "id" TEXT NOT NULL,
    "hafalanRecordId" TEXT NOT NULL,
    "recheckDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recheckedBy" TEXT NOT NULL,
    "allPassed" BOOLEAN NOT NULL,
    "failedAyats" TEXT NOT NULL DEFAULT '[]',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recheck_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wali_profiles_userId_key" ON "wali_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "santri_profiles_userId_key" ON "santri_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "santri_teacher_assignments_santriId_teacherId_key" ON "santri_teacher_assignments"("santriId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "kaca_pageNumber_key" ON "kaca"("pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hafalan_ayat_statuses_hafalanRecordId_ayatNumber_key" ON "hafalan_ayat_statuses"("hafalanRecordId", "ayatNumber");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wali_profiles" ADD CONSTRAINT "wali_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_profiles" ADD CONSTRAINT "santri_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_profiles" ADD CONSTRAINT "santri_profiles_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_profiles" ADD CONSTRAINT "santri_profiles_waliId_fkey" FOREIGN KEY ("waliId") REFERENCES "wali_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_teacher_assignments" ADD CONSTRAINT "santri_teacher_assignments_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_teacher_assignments" ADD CONSTRAINT "santri_teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_kacaId_fkey" FOREIGN KEY ("kacaId") REFERENCES "kaca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_ayat_statuses" ADD CONSTRAINT "hafalan_ayat_statuses_hafalanRecordId_fkey" FOREIGN KEY ("hafalanRecordId") REFERENCES "hafalan_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_history" ADD CONSTRAINT "hafalan_history_hafalanRecordId_fkey" FOREIGN KEY ("hafalanRecordId") REFERENCES "hafalan_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hafalan_history" ADD CONSTRAINT "hafalan_history_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recheck_records" ADD CONSTRAINT "recheck_records_hafalanRecordId_fkey" FOREIGN KEY ("hafalanRecordId") REFERENCES "hafalan_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
