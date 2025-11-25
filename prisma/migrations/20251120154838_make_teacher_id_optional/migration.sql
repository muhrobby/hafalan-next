-- DropForeignKey
ALTER TABLE "hafalan_records" DROP CONSTRAINT "hafalan_records_teacherId_fkey";

-- AlterTable
ALTER TABLE "hafalan_records" ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "hafalan_records" ADD CONSTRAINT "hafalan_records_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
