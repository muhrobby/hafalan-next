import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";

const assignSchema = z.object({
  teacherIds: z
    .array(z.string().cuid())
    .min(1, "At least one teacher is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { santriId } = await params;
    const { teacherIds } = assignSchema.parse(await request.json());

    const [santri, teachers] = await Promise.all([
      db.santriProfile.findUnique({ where: { id: santriId } }),
      db.teacherProfile.findMany({ where: { id: { in: teacherIds } } }),
    ]);

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    if (teachers.length !== teacherIds.length) {
      return NextResponse.json(
        { error: "One or more teachers not found" },
        { status: 400 }
      );
    }

    // Update santri with first teacher as primary teacher (backward compatibility)
    // and create assignments for all selected teachers
    await db.$transaction(async (tx) => {
      // Update primary teacher
      await tx.santriProfile.update({
        where: { id: santriId },
        data: { teacherId: teacherIds[0] },
      });

      // Delete existing assignments
      await tx.santriTeacherAssignment.deleteMany({
        where: { santriId },
      });

      // Create new assignments
      await tx.santriTeacherAssignment.createMany({
        data: teacherIds.map((teacherId) => ({
          santriId,
          teacherId,
        })),
      });
    });

    // Fetch updated santri with all relationships
    const updatedSantri = await db.santriProfile.findUnique({
      where: { id: santriId },
      include: {
        user: { select: { name: true, email: true } },
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        wali: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        teacherAssignments: {
          include: {
            teacher: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedSantri);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error assigning teachers", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
