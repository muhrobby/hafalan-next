import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { allQuranPages, KacaData } from "../db/quran-pages";

// Load environment variables from .env
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

// Consolidate multiple surah entries on same page into single entry
function consolidatePages(pages: KacaData[]): KacaData[] {
  const pageMap = new Map<number, KacaData>();
  
  pages.forEach(page => {
    const existing = pageMap.get(page.pageNumber);
    if (!existing) {
      // First entry for this page
      pageMap.set(page.pageNumber, {
        ...page,
        description: `${page.surahName} ${page.ayatStart}-${page.ayatEnd}`
      });
    } else {
      // Page already exists - this means multiple surahs on same page
      // Update description to include all surahs
      const newDesc = existing.description 
        ? `${existing.description}, ${page.surahName} ${page.ayatStart}-${page.ayatEnd}`
        : `${existing.surahName} ${existing.ayatStart}-${existing.ayatEnd}, ${page.surahName} ${page.ayatStart}-${page.ayatEnd}`;
      
      pageMap.set(page.pageNumber, {
        ...existing,
        description: newDesc,
        // Keep the first surah as primary, but note we have more in description
      });
    }
  });
  
  return Array.from(pageMap.values()).sort((a, b) => a.pageNumber - b.pageNumber);
}

async function seedKaca() {
  console.log("🕌 Seeding Kaca (Qur'an Pages)...");
  
  // Consolidate pages with multiple surahs
  const consolidatedPages = consolidatePages(allQuranPages);
  console.log(`   📖 Raw entries: ${allQuranPages.length}`);
  console.log(`   📖 Consolidated pages: ${consolidatedPages.length}`);

  try {
    // Use upsert instead of delete to preserve existing hafalan records
    let insertedCount = 0;
    let updatedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < consolidatedPages.length; i += batchSize) {
      const batch = consolidatedPages.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (kaca) => {
          const existing = await prisma.kaca.findUnique({
            where: { pageNumber: kaca.pageNumber },
          });

          await prisma.kaca.upsert({
            where: { pageNumber: kaca.pageNumber },
            update: kaca,
            create: kaca,
          });

          return existing ? "updated" : "inserted";
        })
      );

      insertedCount += results.filter((r) => r === "inserted").length;
      updatedCount += results.filter((r) => r === "updated").length;

      const currentJuz = batch[batch.length - 1]?.juz || 0;
      console.log(
        `   📄 Processed ${i + batch.length}/${
          consolidatedPages.length
        } pages (Juz ${currentJuz})`
      );
    }

    console.log(`✅ Successfully seeded kaca pages:`);
    console.log(`   - Inserted: ${insertedCount} new pages`);
    console.log(`   - Updated: ${updatedCount} existing pages`);
    console.log(`   - Total: ${consolidatedPages.length} unique pages (all 30 juz)`);
  } catch (error) {
    console.error("❌ Error seeding kaca:", error);
    throw error;
  }
}

async function seedUsers() {
  console.log("👥 Seeding Users...");

  try {
    // Clear existing user data
    await prisma.user.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.waliProfile.deleteMany();
    await prisma.santriProfile.deleteMany();

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@hafalan.com",
        name: "Administrator",
        password:
          "$2b$12$1Q1Q/BqJ79fOO7WBaSXcP.CmN/1zBh8a.bx5h03n6yracEbeWkUQK", // password: admin123
        role: "ADMIN",
      },
    });

    // Create teacher user
    const teacherUser = await prisma.user.create({
      data: {
        email: "teacher@hafalan.com",
        name: "Ustadz Ahmad",
        password:
          "$2b$12$L.AYcPDNaRni1EjXXczP/uHUaSxQ29jLYayRfV9V0i.19g4do26KK", // password: teacher123
        role: "TEACHER",
      },
    });

    // Create teacher profile
    const teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        nip: "198001012020121001",
        phone: "+62812345678",
        address: "Jakarta, Indonesia",
        isActive: true,
      },
    });

    // Create wali user
    const waliUser = await prisma.user.create({
      data: {
        email: "wali@hafalan.com",
        name: "Bapak Ahmad",
        password:
          "$2b$12$pVg6Qkyit9uHKR6dLzRPROnYMVF0hNm.pOxEv2jNLhmEl4Q79MX9O", // password: wali123
        role: "WALI",
      },
    });

    // Create wali profile
    const waliProfile = await prisma.waliProfile.create({
      data: {
        userId: waliUser.id,
        phone: "+62812345679",
        address: "Jakarta, Indonesia",
        occupation: "Pegawai Swasta",
        isActive: true,
      },
    });

    // Create santri user
    const santriUser = await prisma.user.create({
      data: {
        email: "santri@hafalan.com",
        name: "Muhammad Ali",
        password:
          "$2b$12$z8K2mZhTTKghyarlKbgBCud51xlTmYntls/GZIESax4f7PRks3f/C", // password: santri123
        role: "SANTRI",
      },
    });

    // Create santri profile
    const santriProfile = await prisma.santriProfile.create({
      data: {
        userId: santriUser.id,
        nis: "2024001",
        birthDate: new Date("2010-01-15"),
        birthPlace: "Jakarta",
        gender: "MALE",
        address: "Jakarta, Indonesia",
        phone: "+62812345680",
        isActive: true,
        joinDate: new Date("2024-01-01"),
        teacherId: teacherProfile.id,
        waliId: waliProfile.id,
      },
    });

    console.log("✅ Successfully seeded users:");
    console.log(`   - Admin: ${adminUser.email} (password: admin123)`);
    console.log(`   - Teacher: ${teacherUser.email} (password: teacher123)`);
    console.log(`   - Wali: ${waliUser.email} (password: wali123)`);
    console.log(`   - Santri: ${santriUser.email} (password: santri123)`);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting database seed...");

  // Log env status
  console.log("📋 Environment Check:");
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "✓" : "✗"}`);
  console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? "✓" : "✗"}`);
  console.log("");

  try {
    // Test connection
    console.log("🔗 Testing database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Database connection successful");
    console.log("");

    await seedKaca();
    await seedUsers();

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("💥 Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
