import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

// GET - Lihat semua santri binaan guru
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guruId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { guruId } = await params;

    // Cari teacher profile
    const teacher = await db.teacherProfile.findUnique({
      where: { id: guruId },
      include: {
        user: { select: { name: true, email: true } },
        teacherAssignments: {
          include: {
            santri: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                wali: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      );
    }

    const santriList = teacher.teacherAssignments.map((assignment) => ({
      assignmentId: assignment.id,
      santriProfileId: assignment.santri.id,
      santriUserId: assignment.santri.user.id,
      name: assignment.santri.user.name,
      email: assignment.santri.user.email,
      nis: assignment.santri.nis,
      gender: assignment.santri.gender,
      waliName: assignment.santri.wali?.user.name || null,
      isActive: assignment.santri.isActive,
      createdAt: assignment.createdAt,
    }));

    return NextResponse.json({
      guru: {
        id: teacher.id,
        name: teacher.user.name,
        nip: teacher.nip,
      },
      santriCount: santriList.length,
      santriList,
    });
  } catch (error) {
    console.error("Error fetching guru santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const assignSantriSchema = z.object({
  santriIds: z.array(z.string().cuid()).min(1, "Minimal pilih 1 santri"),
});

// POST - Assign santri ke guru
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guruId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { guruId } = await params;
    const body = await request.json();
    const { santriIds } = assignSantriSchema.parse(body);

    // Validasi guru exists
    const teacher = await db.teacherProfile.findUnique({
      where: { id: guruId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi semua santri exists
    const santris = await db.santriProfile.findMany({
      where: { id: { in: santriIds } },
    });

    if (santris.length !== santriIds.length) {
      return NextResponse.json(
        { error: "Satu atau lebih santri tidak ditemukan" },
        { status: 400 }
      );
    }

    // Buat assignments baru (skip duplicates)
    await db.santriTeacherAssignment.createMany({
      data: santriIds.map((santriId) => ({
        santriId,
        teacherId: guruId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `${santriIds.length} santri berhasil ditambahkan`,
    });
  } catch (error) {
    console.error("Error assigning santri:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unassign santri dari guru
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ guruId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { guruId } = await params;

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");

    if (!santriId) {
      return NextResponse.json(
        { error: "santriId diperlukan" },
        { status: 400 }
      );
    }

    // Hapus assignment
    await db.santriTeacherAssignment.deleteMany({
      where: {
        teacherId: guruId,
        santriId: santriId,
      },
    });

    // Update primary teacher jika santri ini menggunakan guru ini sebagai primary
    await db.santriProfile.updateMany({
      where: {
        id: santriId,
        teacherId: guruId,
      },
      data: {
        teacherId: null,
      },
    });

    return NextResponse.json({
      message: "Santri berhasil dihapus dari binaan guru",
    });
  } catch (error) {
    console.error("Error unassigning santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
