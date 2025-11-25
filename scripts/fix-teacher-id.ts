import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking hafalan records with NULL teacherId...");

  // Find records with NULL teacherId
  const recordsWithoutTeacher = await prisma.hafalanRecord.findMany({
    where: {
      OR: [{ teacherId: null }, { teacherId: "" }],
    },
    include: {
      santri: {
        include: {
          teacher: true,
        },
      },
    },
  });

  console.log(
    `Found ${recordsWithoutTeacher.length} records without valid teacherId`
  );

  if (recordsWithoutTeacher.length === 0) {
    console.log("✅ All records have valid teacherId!");
    return;
  }

  // Update each record with santri's primary teacher
  let updated = 0;
  let failed = 0;

  for (const record of recordsWithoutTeacher) {
    try {
      const teacherId = record.santri.teacherId;

      if (!teacherId) {
        console.log(
          `⚠️  Santri ${record.santri.id} has no primary teacher, skipping record ${record.id}`
        );
        failed++;
        continue;
      }

      await prisma.hafalanRecord.update({
        where: { id: record.id },
        data: { teacherId },
      });

      updated++;
      console.log(
        `✅ Updated record ${record.id} with teacherId: ${teacherId}`
      );
    } catch (error) {
      console.error(`❌ Failed to update record ${record.id}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${recordsWithoutTeacher.length}`);
}

main()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
