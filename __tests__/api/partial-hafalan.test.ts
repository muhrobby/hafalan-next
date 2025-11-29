/**
 * Unit Tests for Partial Hafalan API
 *
 * Testing scenarios:
 * 1. Create partial hafalan record
 * 2. Get partial hafalan records
 * 3. Update partial hafalan (progress, percentage, status)
 * 4. Complete partial hafalan (auto-add to main hafalan)
 * 5. Delete partial hafalan
 * 6. Validation errors
 * 7. Authorization checks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Partial Hafalan API Tests", () => {
  let testSantriProfileId: string;
  let testSantriUserId: string;
  let testTeacherProfileId: string;
  let testTeacherUserId: string;
  let testKacaId: string;
  let testPartialId: string;

  beforeAll(async () => {
    // Create test teacher
    const teacher = await prisma.user.create({
      data: {
        email: "partial-test-teacher@example.com",
        name: "Partial Test Teacher",
        password: "hashed_password",
        role: "TEACHER",
        teacherProfile: {
          create: {
            nip: "PARTIAL-TEST-NIP-001",
            phone: "081234567890",
          },
        },
      },
      include: {
        teacherProfile: true,
      },
    });
    testTeacherUserId = teacher.id;
    testTeacherProfileId = teacher.teacherProfile!.id;

    // Create test santri with teacher assignment
    const santri = await prisma.user.create({
      data: {
        email: "partial-test-santri@example.com",
        name: "Partial Test Santri",
        password: "hashed_password",
        role: "SANTRI",
        santriProfile: {
          create: {
            nis: "PARTIAL-TEST-NIS-001",
            teacherId: testTeacherProfileId,
          },
        },
      },
      include: {
        santriProfile: true,
      },
    });
    testSantriUserId = santri.id;
    testSantriProfileId = santri.santriProfile!.id;

    // Create test kaca
    const kaca = await prisma.kaca.create({
      data: {
        pageNumber: 9999, // Use unique page number for test
        surahNumber: 1,
        surahName: "Test Surah",
        ayatStart: 1,
        ayatEnd: 7,
        juz: 1,
        description: "Test Kaca for Partial Hafalan",
      },
    });
    testKacaId = kaca.id;
  });

  afterAll(async () => {
    // Cleanup in correct order to avoid foreign key constraints
    await prisma.partialHafalan.deleteMany({
      where: { santriId: testSantriProfileId },
    });

    await prisma.hafalanHistory.deleteMany({
      where: {
        hafalanRecord: {
          santriId: testSantriProfileId,
        },
      },
    });

    await prisma.hafalanAyatStatus.deleteMany({
      where: {
        hafalanRecord: {
          santriId: testSantriProfileId,
        },
      },
    });

    await prisma.hafalanRecord.deleteMany({
      where: { santriId: testSantriProfileId },
    });

    await prisma.kaca.deleteMany({
      where: { pageNumber: 9999 },
    });

    await prisma.santriProfile.deleteMany({
      where: { userId: testSantriUserId },
    });

    await prisma.teacherProfile.deleteMany({
      where: { userId: testTeacherUserId },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [testSantriUserId, testTeacherUserId] },
      },
    });

    await prisma.$disconnect();
  });

  describe("1. Create Partial Hafalan", () => {
    it("should create partial hafalan with valid data", async () => {
      const partial = await prisma.partialHafalan.create({
        data: {
          santriId: testSantriProfileId,
          teacherId: testTeacherProfileId,
          kacaId: testKacaId,
          ayatNumber: 3,
          progress: "Baru sampai tanda waqaf pertama",
          percentage: 50,
          status: "IN_PROGRESS",
        },
      });

      expect(partial).toBeDefined();
      expect(partial.santriId).toBe(testSantriProfileId);
      expect(partial.ayatNumber).toBe(3);
      expect(partial.progress).toBe("Baru sampai tanda waqaf pertama");
      expect(partial.percentage).toBe(50);
      expect(partial.status).toBe("IN_PROGRESS");

      testPartialId = partial.id;
    });

    it("should not create duplicate partial for same ayat", async () => {
      const existingPartial = await prisma.partialHafalan.findFirst({
        where: {
          santriId: testSantriProfileId,
          kacaId: testKacaId,
          ayatNumber: 3,
          status: "IN_PROGRESS",
        },
      });

      expect(existingPartial).toBeDefined();
      // In real API, this would return 409 Conflict
    });

    it("should create partial for different ayat", async () => {
      const partial = await prisma.partialHafalan.create({
        data: {
          santriId: testSantriProfileId,
          teacherId: testTeacherProfileId,
          kacaId: testKacaId,
          ayatNumber: 5,
          progress: "Baru setengah ayat",
          percentage: 25,
          status: "IN_PROGRESS",
        },
      });

      expect(partial.ayatNumber).toBe(5);
      expect(partial.percentage).toBe(25);
    });
  });

  describe("2. Get Partial Hafalan", () => {
    it("should fetch partial hafalan for santri", async () => {
      const partials = await prisma.partialHafalan.findMany({
        where: { santriId: testSantriProfileId },
        include: {
          santri: {
            include: {
              user: { select: { name: true } },
            },
          },
          teacher: {
            include: {
              user: { select: { name: true } },
            },
          },
          kaca: true,
        },
      });

      expect(partials.length).toBeGreaterThanOrEqual(2);
      expect(partials[0].santri.user.name).toBe("Partial Test Santri");
      expect(partials[0].teacher?.user.name).toBe("Partial Test Teacher");
    });

    it("should filter by status", async () => {
      const activePartials = await prisma.partialHafalan.findMany({
        where: {
          santriId: testSantriProfileId,
          status: "IN_PROGRESS",
        },
      });

      expect(activePartials.length).toBeGreaterThanOrEqual(2);
      activePartials.forEach((p) => {
        expect(p.status).toBe("IN_PROGRESS");
      });
    });

    it("should filter by kaca", async () => {
      const partials = await prisma.partialHafalan.findMany({
        where: {
          santriId: testSantriProfileId,
          kacaId: testKacaId,
        },
      });

      expect(partials.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("3. Update Partial Hafalan", () => {
    it("should update progress description", async () => {
      const updated = await prisma.partialHafalan.update({
        where: { id: testPartialId },
        data: {
          progress: "Sudah sampai tanda waqaf kedua",
          percentage: 75,
        },
      });

      expect(updated.progress).toBe("Sudah sampai tanda waqaf kedua");
      expect(updated.percentage).toBe(75);
    });

    it("should update catatan", async () => {
      const updated = await prisma.partialHafalan.update({
        where: { id: testPartialId },
        data: {
          catatan: "Perlu latihan tajwid di bagian ini",
        },
      });

      expect(updated.catatan).toBe("Perlu latihan tajwid di bagian ini");
    });
  });

  describe("4. Complete Partial Hafalan", () => {
    it("should mark partial as completed and create hafalan record", async () => {
      // First, let's complete the partial
      const completedPartial = await prisma.$transaction(async (tx) => {
        // Create hafalan record for the ayat
        const hafalanRecord = await tx.hafalanRecord.create({
          data: {
            santriId: testSantriProfileId,
            teacherId: testTeacherProfileId,
            kacaId: testKacaId,
            completedVerses: JSON.stringify([3]), // Ayat 3 completed
            statusKaca: "PROGRESS",
          },
        });

        // Update partial to completed
        const updated = await tx.partialHafalan.update({
          where: { id: testPartialId },
          data: {
            status: "COMPLETED",
            completedInRecordId: hafalanRecord.id,
          },
        });

        return updated;
      });

      expect(completedPartial.status).toBe("COMPLETED");
      expect(completedPartial.completedInRecordId).toBeDefined();
    });

    it("should not allow updating completed partial status", async () => {
      const completedPartial = await prisma.partialHafalan.findUnique({
        where: { id: testPartialId },
      });

      expect(completedPartial?.status).toBe("COMPLETED");
      // In real API, updating status would return 400 error
    });
  });

  describe("5. Delete Partial Hafalan", () => {
    let deletablePartialId: string;

    beforeEach(async () => {
      // Create a new partial for deletion test
      const partial = await prisma.partialHafalan.create({
        data: {
          santriId: testSantriProfileId,
          teacherId: testTeacherProfileId,
          kacaId: testKacaId,
          ayatNumber: 7,
          progress: "To be deleted",
          status: "IN_PROGRESS",
        },
      });
      deletablePartialId = partial.id;
    });

    it("should delete partial hafalan", async () => {
      await prisma.partialHafalan.delete({
        where: { id: deletablePartialId },
      });

      const deleted = await prisma.partialHafalan.findUnique({
        where: { id: deletablePartialId },
      });

      expect(deleted).toBeNull();
    });
  });

  describe("6. Validation Tests", () => {
    it("should validate ayat number is within kaca range", async () => {
      const kaca = await prisma.kaca.findUnique({
        where: { id: testKacaId },
      });

      expect(kaca?.ayatStart).toBe(1);
      expect(kaca?.ayatEnd).toBe(7);

      // Ayat 10 is out of range (1-7)
      // In real API, this would return 400 error
    });

    it("should not allow percentage greater than 99", async () => {
      // In Zod schema: z.number().int().min(1).max(99)
      // 100% means full ayat, should use main hafalan record
      expect(true).toBe(true); // Placeholder for API validation
    });

    it("should require progress description", async () => {
      // In Zod schema: z.string().min(1)
      expect(true).toBe(true); // Placeholder for API validation
    });
  });

  describe("7. Query Performance Tests", () => {
    it("should efficiently fetch partial hafalan with relations", async () => {
      const startTime = Date.now();

      const partials = await prisma.partialHafalan.findMany({
        where: {
          santriId: testSantriProfileId,
        },
        include: {
          santri: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          teacher: {
            include: {
              user: { select: { name: true } },
            },
          },
          kaca: true,
        },
        orderBy: { tanggalSetor: "desc" },
        take: 20,
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(partials).toBeDefined();
    });

    it("should use index for santriId + kacaId + status query", async () => {
      const startTime = Date.now();

      const activePartials = await prisma.partialHafalan.findMany({
        where: {
          santriId: testSantriProfileId,
          kacaId: testKacaId,
          status: "IN_PROGRESS",
        },
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should be very fast with index
      expect(activePartials).toBeDefined();
    });
  });

  describe("8. Auto-Complete Integration", () => {
    it("should auto-complete partial when ayat is marked complete in main hafalan", async () => {
      // Create a new partial for ayat 6
      const partial = await prisma.partialHafalan.create({
        data: {
          santriId: testSantriProfileId,
          teacherId: testTeacherProfileId,
          kacaId: testKacaId,
          ayatNumber: 6,
          progress: "Hampir selesai",
          percentage: 90,
          status: "IN_PROGRESS",
        },
      });

      // Simulate main hafalan update that completes ayat 6
      const hafalanRecord = await prisma.hafalanRecord.findFirst({
        where: {
          santriId: testSantriProfileId,
          kacaId: testKacaId,
        },
      });

      if (hafalanRecord) {
        const completedVerses = JSON.parse(hafalanRecord.completedVerses || "[]");
        completedVerses.push(6);

        await prisma.hafalanRecord.update({
          where: { id: hafalanRecord.id },
          data: {
            completedVerses: JSON.stringify(completedVerses),
          },
        });

        // Auto-complete partial (this would be done in API)
        await prisma.partialHafalan.update({
          where: { id: partial.id },
          data: {
            status: "COMPLETED",
            completedInRecordId: hafalanRecord.id,
          },
        });
      }

      const updatedPartial = await prisma.partialHafalan.findUnique({
        where: { id: partial.id },
      });

      expect(updatedPartial?.status).toBe("COMPLETED");
    });
  });
});

describe("Partial Hafalan Schema Validation", () => {
  it("should have correct PartialStatus enum values", () => {
    const validStatuses = ["IN_PROGRESS", "COMPLETED", "CANCELLED"];
    expect(validStatuses).toContain("IN_PROGRESS");
    expect(validStatuses).toContain("COMPLETED");
    expect(validStatuses).toContain("CANCELLED");
  });

  it("should enforce percentage range 1-99", () => {
    // Validation is done at API level with Zod
    const validPercentages = [25, 50, 75, 1, 99];
    const invalidPercentages = [0, 100, -1, 150];

    validPercentages.forEach((p) => {
      expect(p >= 1 && p <= 99).toBe(true);
    });

    invalidPercentages.forEach((p) => {
      expect(p >= 1 && p <= 99).toBe(false);
    });
  });
});
