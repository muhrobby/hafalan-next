import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { safeParseInt } from "@/lib/rate-limiter";

// Zod schemas with stricter validation
const createHafalanSchema = z.object({
  santriId: z.string().uuid("Invalid santriId format"),
  kacaId: z.string().uuid("Invalid kacaId format"),
  completedVerses: z.array(z.number().int().min(1).max(300)),
  catatan: z.string().max(1000).optional(),
});

const updateHafalanSchema = z.object({
  completedVerses: z.array(z.number().int().min(1).max(300)),
  statusKaca: z
    .enum(["PROGRESS", "COMPLETE_WAITING_RECHECK", "RECHECK_PASSED"])
    .optional(),
  catatan: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");
    const teacherId = searchParams.get("teacherId");
    const kacaId = searchParams.get("kacaId");
    const status = searchParams.get("status");
    // Use safeParseInt with bounds checking
    const page = safeParseInt(searchParams.get("page"), 1, 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 20, 1, 100);

    const where: any = {};

    // Role-based filtering
    if (session.user.role === "TEACHER") {
      // Teachers can only see their own santri's records (both primary and assigned)
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          santris: true, // Primary santris
          teacherAssignments: {
            include: { santri: true },
          },
        },
      });

      if (teacherProfile) {
        // Get IDs from both primary santris and assigned santris
        const primarySantriIds = teacherProfile.santris.map((s) => s.id);
        const assignedSantriIds = teacherProfile.teacherAssignments.map(
          (assignment) => assignment.santri.id
        );
        const allSantriIds = [
          ...new Set([...primarySantriIds, ...assignedSantriIds]),
        ];

        where.santriId = {
          in: allSantriIds,
        };
      }
    } else if (session.user.role === "WALI") {
      // Wali can only see their children's records
      const waliProfile = await db.waliProfile.findUnique({
        where: { userId: session.user.id },
        include: { santris: true },
      });

      if (waliProfile) {
        where.santriId = {
          in: waliProfile.santris.map((s) => s.id),
        };
      }
    } else if (session.user.role === "SANTRI") {
      // Santri can only see their own records
      const santriProfile = await db.santriProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (santriProfile) {
        where.santriId = santriProfile.id;
      }
    }

    if (santriId) where.santriId = santriId;
    // Note: teacherId filter is only applied for ADMIN role
    // For TEACHER role, we already filter by their assigned santris above
    if (teacherId && session.user.role === "ADMIN") {
      where.teacherId = teacherId;
    }
    if (kacaId) where.kacaId = kacaId;
    if (status) where.statusKaca = status;

    // Fetch records without teacher first to avoid relation errors
    const [recordsRaw, total] = await Promise.all([
      db.hafalanRecord.findMany({
        where,
        include: {
          santri: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          kaca: true,
          ayatStatuses: true,
          history: {
            include: {
              teacher: {
                include: {
                  user: { select: { name: true } },
                },
              },
            },
            orderBy: { date: "desc" },
          },
          recheckRecords: {
            orderBy: { recheckDate: "desc" },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.hafalanRecord.count({ where }),
    ]);

    // Fetch teacher data separately to handle potential orphaned relations
    const teacherIds = [
      ...new Set(
        recordsRaw
          .map((r) => r.teacherId)
          .filter((id): id is string => typeof id === "string")
      ),
    ];
    const teachers = await db.teacherProfile.findMany({
      where: { id: { in: teacherIds } },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // Fetch user data for recheck records (recheckedBy is userId)
    const recheckerUserIds = [
      ...new Set(
        recordsRaw
          .flatMap((r) => r.recheckRecords.map((rr) => rr.recheckedBy))
          .filter((id): id is string => typeof id === "string")
      ),
    ];
    const recheckerUsers = await db.user.findMany({
      where: { id: { in: recheckerUserIds } },
      select: { id: true, name: true },
    });

    const recheckerUserMap = new Map(recheckerUsers.map((u) => [u.id, u]));

    // Merge teacher data with records and resolve rechecker names
    const records = recordsRaw.map((record) => ({
      ...record,
      teacher: record.teacherId ? teacherMap.get(record.teacherId) : null,
      recheckRecords: record.recheckRecords.map((rr) => ({
        ...rr,
        recheckedByName:
          recheckerUserMap.get(rr.recheckedBy)?.name || "Unknown",
      })),
    }));

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching hafalan records:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createHafalanSchema.parse(body);

    // Check if teacher can access this santri
    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          santris: true,
          teacherAssignments: {
            include: {
              santri: true,
            },
          },
        },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      // Check both primary teacher (santris) and teacher assignments
      const isPrimaryTeacher = teacherProfile.santris.some(
        (s) => s.id === validatedData.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (assignment) => assignment.santri.id === validatedData.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to access this santri" },
          { status: 403 }
        );
      }
    }

    // Optimized: Fetch kaca, existing record, and teacher profile in parallel
    const [kaca, existingRecord, teacherProfile] = await Promise.all([
      db.kaca.findUnique({
        where: { id: validatedData.kacaId },
      }),
      db.hafalanRecord.findFirst({
        where: {
          santriId: validatedData.santriId,
          kacaId: validatedData.kacaId,
        },
      }),
      db.teacherProfile.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    if (!kaca) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    if (existingRecord) {
      return NextResponse.json(
        { error: "Hafalan record already exists for this santri and kaca" },
        { status: 400 }
      );
    }

    if (!teacherProfile) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Create hafalan record
    const hafalanRecord = await db.hafalanRecord.create({
      data: {
        santriId: validatedData.santriId,
        teacherId: teacherProfile.id, // Use teacherProfile.id, not user.id
        kacaId: validatedData.kacaId,
        completedVerses: JSON.stringify(validatedData.completedVerses),
        catatan: validatedData.catatan,
        statusKaca:
          validatedData.completedVerses.length ===
          kaca.ayatEnd - kaca.ayatStart + 1
            ? "COMPLETE_WAITING_RECHECK"
            : "PROGRESS",
      },
      include: {
        santri: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        kaca: true,
      },
    });

    // Create ayat statuses
    const ayatStatuses: {
      hafalanRecordId: string;
      ayatNumber: number;
      status: "LANJUT" | "ULANG";
    }[] = [];
    for (let ayat = kaca.ayatStart; ayat <= kaca.ayatEnd; ayat++) {
      ayatStatuses.push({
        hafalanRecordId: hafalanRecord.id,
        ayatNumber: ayat,
        status: validatedData.completedVerses.includes(ayat)
          ? "LANJUT"
          : "ULANG",
      });
    }

    await db.hafalanAyatStatus.createMany({
      data: ayatStatuses,
    });

    // Create history record
    await db.hafalanHistory.create({
      data: {
        hafalanRecordId: hafalanRecord.id,
        teacherId: teacherProfile.id,
        completedVerses: JSON.stringify(validatedData.completedVerses),
        catatan: validatedData.catatan,
      },
    });

    return NextResponse.json(hafalanRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating hafalan record:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
