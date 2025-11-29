import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { safeParseInt } from "@/lib/rate-limiter";

// Zod schemas
const createPartialSchema = z.object({
  santriId: z.string().cuid("Invalid santriId format"),
  kacaId: z.string().cuid("Invalid kacaId format"),
  ayatNumber: z.number().int().min(1).max(300),
  progress: z
    .string()
    .min(1, "Progress description is required")
    .max(500, "Progress description too long"),
  percentage: z.number().int().min(1).max(99).optional(),
  catatan: z.string().max(1000).optional(),
});

const updatePartialSchema = z.object({
  progress: z.string().min(1).max(500).optional(),
  percentage: z.number().int().min(1).max(99).optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  catatan: z.string().max(1000).optional(),
});

/**
 * GET /api/hafalan/partial
 * Get partial hafalan records for a santri
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");
    const kacaId = searchParams.get("kacaId");
    const status = searchParams.get("status");
    const page = safeParseInt(searchParams.get("page"), 1, 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 20, 1, 100);

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          santris: true,
          teacherAssignments: {
            include: { santri: true },
          },
        },
      });

      if (teacherProfile) {
        const primarySantriIds = teacherProfile.santris.map((s) => s.id);
        const assignedSantriIds = teacherProfile.teacherAssignments.map(
          (a) => a.santri.id
        );
        const allSantriIds = [
          ...new Set([...primarySantriIds, ...assignedSantriIds]),
        ];

        where.santriId = { in: allSantriIds };
      }
    } else if (session.user.role === "WALI") {
      const waliProfile = await db.waliProfile.findUnique({
        where: { userId: session.user.id },
        include: { santris: true },
      });

      if (waliProfile) {
        where.santriId = { in: waliProfile.santris.map((s) => s.id) };
      }
    } else if (session.user.role === "SANTRI") {
      const santriProfile = await db.santriProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (santriProfile) {
        where.santriId = santriProfile.id;
      }
    }

    // Additional filters
    if (santriId) where.santriId = santriId;
    if (kacaId) where.kacaId = kacaId;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      db.partialHafalan.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.partialHafalan.count({ where }),
    ]);

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
    console.error("Error fetching partial hafalan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hafalan/partial
 * Create a new partial hafalan record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createPartialSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify santri access for teachers
    if (session.user.role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          santris: true,
          teacherAssignments: { include: { santri: true } },
        },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      const isPrimaryTeacher = teacherProfile.santris.some(
        (s) => s.id === validatedData.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (a) => a.santri.id === validatedData.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to access this santri" },
          { status: 403 }
        );
      }
    }

    // Check if santri and kaca exist
    const [santri, kaca] = await Promise.all([
      db.santriProfile.findUnique({ where: { id: validatedData.santriId } }),
      db.kaca.findUnique({ where: { id: validatedData.kacaId } }),
    ]);

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    if (!kaca) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    // Validate ayat number is within kaca range
    if (
      validatedData.ayatNumber < kaca.ayatStart ||
      validatedData.ayatNumber > kaca.ayatEnd
    ) {
      return NextResponse.json(
        {
          error: `Ayat number must be between ${kaca.ayatStart} and ${kaca.ayatEnd}`,
        },
        { status: 400 }
      );
    }

    // Check if there's already an active partial for this ayat
    const existingPartial = await db.partialHafalan.findFirst({
      where: {
        santriId: validatedData.santriId,
        kacaId: validatedData.kacaId,
        ayatNumber: validatedData.ayatNumber,
        status: "IN_PROGRESS",
      },
    });

    if (existingPartial) {
      return NextResponse.json(
        {
          error: "There is already an active partial hafalan for this ayat",
          existingId: existingPartial.id,
        },
        { status: 409 }
      );
    }

    // Check if ayat is already completed in main hafalan record
    const existingHafalan = await db.hafalanRecord.findFirst({
      where: {
        santriId: validatedData.santriId,
        kacaId: validatedData.kacaId,
      },
    });

    if (existingHafalan) {
      const completedVerses = JSON.parse(
        existingHafalan.completedVerses || "[]"
      );
      if (completedVerses.includes(validatedData.ayatNumber)) {
        return NextResponse.json(
          { error: "This ayat is already fully memorized" },
          { status: 400 }
        );
      }
    }

    // Get teacher profile ID
    let teacherId: string | null = null;
    if (session.user.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });
      teacherId = teacher?.id ?? null;
    }

    // Create partial hafalan
    const partial = await db.partialHafalan.create({
      data: {
        santriId: validatedData.santriId,
        kacaId: validatedData.kacaId,
        ayatNumber: validatedData.ayatNumber,
        progress: validatedData.progress,
        percentage: validatedData.percentage,
        catatan: validatedData.catatan,
        teacherId,
        status: "IN_PROGRESS",
      },
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

    return NextResponse.json(partial, { status: 201 });
  } catch (error) {
    console.error("Error creating partial hafalan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
