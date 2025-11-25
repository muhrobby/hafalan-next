/**
 * End-to-End Tests for Santri-Teacher Assignment
 *
 * Testing scenarios:
 * 1. Multi-teacher assignment persists correctly in database
 * 2. Teacher page displays correct santri counts from teacherAssignments
 * 3. Santri detail modal auto-refreshes after save operations
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Santri-Teacher Assignment E2E Tests", () => {
  let testSantriId: string;
  let testTeacherIds: string[] = [];
  let testWaliId: string;

  beforeAll(async () => {
    // Setup: Create test data
    // Create test wali
    const wali = await prisma.user.create({
      data: {
        email: "test-wali@example.com",
        name: "Test Wali",
        password: "hashed_password",
        role: "WALI",
        waliProfile: {
          create: {
            phone: "081234567890",
            address: "Test Address",
          },
        },
      },
    });
    testWaliId = wali.id;

    // Create test santri
    const santri = await prisma.user.create({
      data: {
        email: "test-santri@example.com",
        name: "Test Santri",
        password: "hashed_password",
        role: "SANTRI",
        santriProfile: {
          create: {
            nis: "TEST-NIS-001",
            dateOfBirth: new Date("2010-01-01"),
            placeOfBirth: "Test City",
          },
        },
      },
      include: {
        santriProfile: true,
      },
    });
    testSantriId = santri.id;

    // Create 3 test teachers
    for (let i = 1; i <= 3; i++) {
      const teacher = await prisma.user.create({
        data: {
          email: `test-teacher${i}@example.com`,
          name: `Test Teacher ${i}`,
          password: "hashed_password",
          role: "TEACHER",
          teacherProfile: {
            create: {
              nip: `TEST-NIP-${i.toString().padStart(3, "0")}`,
              specialization: "Tahfidz",
            },
          },
        },
      });
      testTeacherIds.push(teacher.id);
    }
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await prisma.santriTeacherAssignment.deleteMany({
      where: {
        OR: [{ santriId: testSantriId }, { teacherId: { in: testTeacherIds } }],
      },
    });

    await prisma.santriProfile.deleteMany({
      where: { userId: testSantriId },
    });

    await prisma.teacherProfile.deleteMany({
      where: { userId: { in: testTeacherIds } },
    });

    await prisma.waliProfile.deleteMany({
      where: { userId: testWaliId },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [testSantriId, testWaliId, ...testTeacherIds] },
      },
    });

    await prisma.$disconnect();
  });

  describe("Multi-Teacher Assignment", () => {
    it("should persist multiple teacher assignments in database", async () => {
      // Get santri profile
      const santriProfile = await prisma.santriProfile.findUnique({
        where: { userId: testSantriId },
      });

      expect(santriProfile).not.toBeNull();

      // Assign all 3 teachers to santri
      const assignments = await Promise.all(
        testTeacherIds.map((teacherId) =>
          prisma.santriTeacherAssignment.create({
            data: {
              santriId: santriProfile!.id,
              teacherId: teacherId,
            },
          })
        )
      );

      expect(assignments).toHaveLength(3);

      // Verify assignments in database
      const savedAssignments = await prisma.santriTeacherAssignment.findMany({
        where: { santriId: santriProfile!.id },
      });

      expect(savedAssignments).toHaveLength(3);

      // Verify all teacher IDs are present
      const savedTeacherIds = savedAssignments.map((a) => a.teacherId);
      testTeacherIds.forEach((id) => {
        expect(savedTeacherIds).toContain(id);
      });
    });

    it("should handle updating teacher assignments (remove and add)", async () => {
      const santriProfile = await prisma.santriProfile.findUnique({
        where: { userId: testSantriId },
      });

      // Remove first teacher, keep second, add would-be-third if not exists
      const newTeacherIds = testTeacherIds.slice(1); // Remove first teacher

      // Delete all existing assignments
      await prisma.santriTeacherAssignment.deleteMany({
        where: { santriId: santriProfile!.id },
      });

      // Create new assignments
      await Promise.all(
        newTeacherIds.map((teacherId) =>
          prisma.santriTeacherAssignment.create({
            data: {
              santriId: santriProfile!.id,
              teacherId: teacherId,
            },
          })
        )
      );

      // Verify updated assignments
      const updatedAssignments = await prisma.santriTeacherAssignment.findMany({
        where: { santriId: santriProfile!.id },
      });

      expect(updatedAssignments).toHaveLength(2);
      expect(updatedAssignments.map((a) => a.teacherId)).not.toContain(
        testTeacherIds[0]
      ); // First teacher removed
    });
  });

  describe("Teacher Data with Santri Assignments", () => {
    it("should fetch teacher with all assigned santri using teacherAssignments relation", async () => {
      // This tests the API fix: using teacherAssignments instead of santriAssignments
      const teachers = await prisma.user.findMany({
        where: { role: "TEACHER" },
        include: {
          teacherProfile: {
            include: {
              teacherAssignments: {
                include: {
                  santri: {
                    include: {
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Find our test teacher (should have assignments from previous test)
      const testTeacher = teachers.find((t) => testTeacherIds.includes(t.id));

      expect(testTeacher).toBeDefined();
      expect(testTeacher?.teacherProfile).toBeDefined();

      // This should not be undefined or throw an error
      // (The bug was using 'santriAssignments' which doesn't exist)
      expect(testTeacher?.teacherProfile?.teacherAssignments).toBeDefined();

      // Verify the field is an array
      expect(
        Array.isArray(testTeacher?.teacherProfile?.teacherAssignments)
      ).toBe(true);
    });

    it("should correctly count santri for each teacher", async () => {
      const santriProfile = await prisma.santriProfile.findUnique({
        where: { userId: testSantriId },
      });

      // Ensure we have assignments
      await prisma.santriTeacherAssignment.deleteMany({
        where: { santriId: santriProfile!.id },
      });

      // Assign first 2 teachers
      await Promise.all(
        testTeacherIds.slice(0, 2).map((teacherId) =>
          prisma.santriTeacherAssignment.create({
            data: {
              santriId: santriProfile!.id,
              teacherId: teacherId,
            },
          })
        )
      );

      // Fetch teachers with counts
      const teachers = await prisma.user.findMany({
        where: {
          role: "TEACHER",
          id: { in: testTeacherIds },
        },
        include: {
          teacherProfile: {
            include: {
              teacherAssignments: {
                include: {
                  santri: true,
                },
              },
            },
          },
        },
      });

      // First two teachers should have 1 santri each
      const teacher1 = teachers.find((t) => t.id === testTeacherIds[0]);
      const teacher2 = teachers.find((t) => t.id === testTeacherIds[1]);
      const teacher3 = teachers.find((t) => t.id === testTeacherIds[2]);

      expect(teacher1?.teacherProfile?.teacherAssignments.length).toBe(1);
      expect(teacher2?.teacherProfile?.teacherAssignments.length).toBe(1);
      expect(teacher3?.teacherProfile?.teacherAssignments.length).toBe(0);
    });
  });

  describe("Santri Data Refresh Pattern", () => {
    it("should fetch fresh santri data after assignment update", async () => {
      // Simulate the refetchSantri() pattern used in the modal
      const santriProfile = await prisma.santriProfile.findUnique({
        where: { userId: testSantriId },
      });

      // Initial state: assign 1 teacher
      await prisma.santriTeacherAssignment.deleteMany({
        where: { santriId: santriProfile!.id },
      });

      await prisma.santriTeacherAssignment.create({
        data: {
          santriId: santriProfile!.id,
          teacherId: testTeacherIds[0],
        },
      });

      // Fetch santri data (like initial modal load)
      const santri1 = await prisma.user.findUnique({
        where: { id: testSantriId },
        include: {
          santriProfile: {
            include: {
              teacherAssignments: {
                include: {
                  teacher: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(santri1?.santriProfile?.teacherAssignments.length).toBe(1);

      // Simulate user adding 2 more teachers (like handleSaveTeachers)
      await Promise.all(
        testTeacherIds.slice(1).map((teacherId) =>
          prisma.santriTeacherAssignment.create({
            data: {
              santriId: santriProfile!.id,
              teacherId: teacherId,
            },
          })
        )
      );

      // Refetch santri data (like after save in modal)
      const santri2 = await prisma.user.findUnique({
        where: { id: testSantriId },
        include: {
          santriProfile: {
            include: {
              teacherAssignments: {
                include: {
                  teacher: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Should reflect new count immediately
      expect(santri2?.santriProfile?.teacherAssignments.length).toBe(3);
    });

    it("should fetch fresh santri data after wali assignment", async () => {
      const santriProfile = await prisma.santriProfile.findUnique({
        where: { userId: testSantriId },
      });

      // Initial state: no wali
      await prisma.santriProfile.update({
        where: { id: santriProfile!.id },
        data: { waliId: null },
      });

      // Fetch initial data
      const santri1 = await prisma.user.findUnique({
        where: { id: testSantriId },
        include: {
          santriProfile: {
            include: {
              wali: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      expect(santri1?.santriProfile?.wali).toBeNull();

      // Assign wali
      await prisma.santriProfile.update({
        where: { id: santriProfile!.id },
        data: { waliId: testWaliId },
      });

      // Refetch data (like refetchSantri after handleSaveWali)
      const santri2 = await prisma.user.findUnique({
        where: { id: testSantriId },
        include: {
          santriProfile: {
            include: {
              wali: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      // Should reflect wali assignment immediately
      expect(santri2?.santriProfile?.wali).not.toBeNull();
      expect(santri2?.santriProfile?.wali?.userId).toBe(testWaliId);
    });
  });

  describe("API Include Chain Validation", () => {
    it("should support nested includes: teacherProfile.teacherAssignments.santri.user", async () => {
      // This validates the API include structure is correct
      const result = await prisma.user.findMany({
        where: { role: "TEACHER" },
        include: {
          teacherProfile: {
            include: {
              teacherAssignments: {
                include: {
                  santri: {
                    include: {
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Should execute without TypeScript errors
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify structure for any teacher with assignments
      const teacherWithAssignments = result.find(
        (t) => t.teacherProfile?.teacherAssignments.length > 0
      );

      if (teacherWithAssignments) {
        const assignment =
          teacherWithAssignments.teacherProfile?.teacherAssignments[0];
        expect(assignment).toHaveProperty("santri");
        expect(assignment.santri).toHaveProperty("user");
        expect(assignment.santri.user).toHaveProperty("name");
        expect(assignment.santri.user).toHaveProperty("email");
      }
    });

    it("should support nested includes: santriProfile.teacherAssignments.teacher.user", async () => {
      // This validates the santri side of the relation
      const result = await prisma.user.findMany({
        where: { role: "SANTRI" },
        include: {
          santriProfile: {
            include: {
              teacherAssignments: {
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: {
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify structure for santri with assignments
      const santriWithAssignments = result.find(
        (s) => s.santriProfile?.teacherAssignments.length > 0
      );

      if (santriWithAssignments) {
        const assignment =
          santriWithAssignments.santriProfile?.teacherAssignments[0];
        expect(assignment).toHaveProperty("teacher");
        expect(assignment.teacher).toHaveProperty("user");
        expect(assignment.teacher.user).toHaveProperty("name");
        expect(assignment.teacher.user).toHaveProperty("email");
      }
    });
  });
});
