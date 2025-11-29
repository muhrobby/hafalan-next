import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Zod schemas
const idSchema = z.string().cuid("Invalid ID format");

const updatePartialSchema = z.object({
  progress: z.string().min(1).max(500).optional(),
  percentage: z.number().int().min(1).max(99).optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  catatan: z.string().max(1000).optional(),
});

/**
 * GET /api/hafalan/partial/[id]
 * Get a single partial hafalan record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const record = await db.partialHafalan.findUnique({
      where: { id },
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
        completedInRecord: true,
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Partial hafalan not found" },
        { status: 404 }
      );
    }

    // Role-based access check
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
        (s) => s.id === record.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (a) => a.santri.id === record.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to access this record" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "SANTRI") {
      const santriProfile = await db.santriProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (santriProfile?.id !== record.santriId) {
        return NextResponse.json(
          { error: "Unauthorized to access this record" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "WALI") {
      const waliProfile = await db.waliProfile.findUnique({
        where: { userId: session.user.id },
        include: { santris: true },
      });

      if (!waliProfile?.santris.some((s) => s.id === record.santriId)) {
        return NextResponse.json(
          { error: "Unauthorized to access this record" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching partial hafalan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hafalan/partial/[id]
 * Update a partial hafalan record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updatePartialSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Find existing record
    const existingRecord = await db.partialHafalan.findUnique({
      where: { id },
      include: {
        kaca: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Partial hafalan not found" },
        { status: 404 }
      );
    }

    // Check if already completed or cancelled
    if (existingRecord.status !== "IN_PROGRESS" && validatedData.status) {
      return NextResponse.json(
        { error: "Cannot update status of a non-active partial hafalan" },
        { status: 400 }
      );
    }

    // Role-based access check for teachers
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
        (s) => s.id === existingRecord.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (a) => a.santri.id === existingRecord.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to update this record" },
          { status: 403 }
        );
      }
    }

    // If status is being changed to COMPLETED, handle completion logic
    if (validatedData.status === "COMPLETED") {
      // Mark the ayat as completed in the main hafalan record
      const result = await db.$transaction(async (tx) => {
        // Find or create hafalan record
        let hafalanRecord = await tx.hafalanRecord.findFirst({
          where: {
            santriId: existingRecord.santriId,
            kacaId: existingRecord.kacaId,
          },
        });

        if (hafalanRecord) {
          // Update existing record to include this ayat
          const completedVerses = JSON.parse(
            hafalanRecord.completedVerses || "[]"
          );
          if (!completedVerses.includes(existingRecord.ayatNumber)) {
            completedVerses.push(existingRecord.ayatNumber);
            completedVerses.sort((a: number, b: number) => a - b);
          }

          // Get teacher ID for history
          let teacherId: string | null = hafalanRecord.teacherId;
          if (session.user.role === "TEACHER") {
            const teacher = await tx.teacherProfile.findUnique({
              where: { userId: session.user.id },
            });
            teacherId = teacher?.id ?? null;
          }

          hafalanRecord = await tx.hafalanRecord.update({
            where: { id: hafalanRecord.id },
            data: {
              completedVerses: JSON.stringify(completedVerses),
              teacherId,
            },
          });

          // Create history record
          if (teacherId) {
            await tx.hafalanHistory.create({
              data: {
                hafalanRecordId: hafalanRecord.id,
                teacherId,
                completedVerses: JSON.stringify(completedVerses),
                catatan: `Partial hafalan ayat ${existingRecord.ayatNumber} completed`,
              },
            });
          }
        } else {
          // Create new hafalan record
          let teacherId: string | null = null;
          if (session.user.role === "TEACHER") {
            const teacher = await tx.teacherProfile.findUnique({
              where: { userId: session.user.id },
            });
            teacherId = teacher?.id ?? null;
          }

          hafalanRecord = await tx.hafalanRecord.create({
            data: {
              santriId: existingRecord.santriId,
              kacaId: existingRecord.kacaId,
              teacherId,
              completedVerses: JSON.stringify([existingRecord.ayatNumber]),
              statusKaca: "PROGRESS",
            },
          });
        }

        // Update partial record to COMPLETED with auto-percentage 100%
        const updatedPartial = await tx.partialHafalan.update({
          where: { id },
          data: {
            ...validatedData,
            status: "COMPLETED",
            percentage: 100, // Auto-set to 100% on completion
            completedInRecordId: hafalanRecord.id,
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

        return updatedPartial;
      });

      return NextResponse.json(result);
    }

    // Regular update (not completion)
    const updated = await db.partialHafalan.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating partial hafalan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hafalan/partial/[id]
 * Delete a partial hafalan record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const existingRecord = await db.partialHafalan.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Partial hafalan not found" },
        { status: 404 }
      );
    }

    // Role-based access check for teachers
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
        (s) => s.id === existingRecord.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (a) => a.santri.id === existingRecord.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to delete this record" },
          { status: 403 }
        );
      }
    }

    await db.partialHafalan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting partial hafalan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
