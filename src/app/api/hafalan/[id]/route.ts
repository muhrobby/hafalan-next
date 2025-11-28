import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { KacaStatus } from "@prisma/client";

const updateHafalanSchema = z.object({
  completedVerses: z.array(z.number()),
  statusKaca: z
    .enum(["PROGRESS", "COMPLETE_WAITING_RECHECK", "RECHECK_PASSED"])
    .optional(),
  catatan: z.string().optional(),
});

const recheckSchema = z.object({
  allPassed: z.boolean(),
  failedAyats: z.array(z.number()).optional(),
  catatan: z.string().optional(),
});

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

    const record = await db.hafalanRecord.findUnique({
      where: { id },
      include: {
        santri: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        kaca: true,
        ayatStatuses: true,
        recheckRecords: {
          orderBy: { createdAt: "desc" },
        },
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
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Hafalan record not found" },
        { status: 404 }
      );
    }

    // Role-based access check
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

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      // Check both primary teacher (santris) and teacher assignments
      const isPrimaryTeacher = teacherProfile.santris.some(
        (s) => s.id === record.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (assignment) => assignment.santri.id === record.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
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

      if (
        !waliProfile ||
        !waliProfile.santris.some((s) => s.id === record.santriId)
      ) {
        return NextResponse.json(
          { error: "Unauthorized to access this record" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "SANTRI") {
      const santriProfile = await db.santriProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!santriProfile || santriProfile.id !== record.santriId) {
        return NextResponse.json(
          { error: "Unauthorized to access this record" },
          { status: 403 }
        );
      }
    }

    // Parse completedVerses from JSON
    const parsedRecord = {
      ...record,
      completedVerses: JSON.parse(record.completedVerses),
    };

    return NextResponse.json(parsedRecord);
  } catch (error) {
    console.error("Error fetching hafalan record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateHafalanSchema.parse(body);

    const { id } = await params;

    const existingRecord = await db.hafalanRecord.findUnique({
      where: { id },
      include: { kaca: true },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Hafalan record not found" },
        { status: 404 }
      );
    }

    let currentTeacherId: string | null = null;

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

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      currentTeacherId = teacherProfile.id;

      // Check both primary teacher (santris) and teacher assignments
      const isPrimaryTeacher = teacherProfile.santris.some(
        (s) => s.id === existingRecord.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (assignment) => assignment.santri.id === existingRecord.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to update this record" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "ADMIN") {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (teacherProfile) {
        currentTeacherId = teacherProfile.id;
      }
    }

    if (validatedData.completedVerses) {
      await db.hafalanAyatStatus.deleteMany({
        where: { hafalanRecordId: id },
      });

      const ayatStatuses: {
        hafalanRecordId: string;
        ayatNumber: number;
        status: "LANJUT" | "ULANG";
      }[] = [];
      for (
        let ayat = existingRecord.kaca.ayatStart;
        ayat <= existingRecord.kaca.ayatEnd;
        ayat++
      ) {
        ayatStatuses.push({
          hafalanRecordId: id,
          ayatNumber: ayat,
          status: validatedData.completedVerses.includes(ayat)
            ? "LANJUT"
            : "ULANG",
        });
      }

      await db.hafalanAyatStatus.createMany({
        data: ayatStatuses,
      });
    }

    const updateData: {
      catatan?: string;
      statusKaca?: KacaStatus;
      completedVerses?: string;
    } = {};

    if (validatedData.catatan) {
      updateData.catatan = validatedData.catatan;
    }

    if (validatedData.completedVerses) {
      updateData.completedVerses = JSON.stringify(
        validatedData.completedVerses
      );

      const totalAyats =
        existingRecord.kaca.ayatEnd - existingRecord.kaca.ayatStart + 1;
      if (validatedData.completedVerses.length === totalAyats) {
        updateData.statusKaca = "COMPLETE_WAITING_RECHECK";
      } else {
        updateData.statusKaca = "PROGRESS";
      }
    }

    if (validatedData.statusKaca) {
      updateData.statusKaca = validatedData.statusKaca as KacaStatus;
    }

    const updatedRecord = await db.hafalanRecord.update({
      where: { id },
      data: updateData,
      include: {
        santri: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        kaca: true,
        ayatStatuses: true,
      },
    });

    // Create history record if teacher is identified and verses are updated
    if (currentTeacherId && validatedData.completedVerses) {
      await db.hafalanHistory.create({
        data: {
          hafalanRecordId: id,
          teacherId: currentTeacherId,
          completedVerses: JSON.stringify(validatedData.completedVerses),
          catatan: validatedData.catatan,
        },
      });
    }

    const parsedRecord = {
      ...updatedRecord,
      completedVerses: JSON.parse(updatedRecord.completedVerses),
    };

    return NextResponse.json(parsedRecord);
  } catch (error) {
    console.error("Error updating hafalan record:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = recheckSchema.parse(body);

    const { id } = await params;

    const existingRecord = await db.hafalanRecord.findUnique({
      where: { id },
      include: { kaca: true },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Hafalan record not found" },
        { status: 404 }
      );
    }

    if (existingRecord.statusKaca !== "COMPLETE_WAITING_RECHECK") {
      return NextResponse.json(
        { error: "This record is not ready for recheck" },
        { status: 400 }
      );
    }

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

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      // Check both primary teacher (santris) and teacher assignments
      const isPrimaryTeacher = teacherProfile.santris.some(
        (s) => s.id === existingRecord.santriId
      );
      const hasAssignment = teacherProfile.teacherAssignments.some(
        (assignment) => assignment.santri.id === existingRecord.santriId
      );

      if (!isPrimaryTeacher && !hasAssignment) {
        return NextResponse.json(
          { error: "Unauthorized to recheck this record" },
          { status: 403 }
        );
      }
    }

    const recheckRecord = await db.recheckRecord.create({
      data: {
        hafalanRecordId: id,
        recheckedBy: session.user.id,
        allPassed: validatedData.allPassed,
        failedAyats: JSON.stringify(validatedData.failedAyats || []),
        catatan: validatedData.catatan,
      },
    });

    // Jika recheck lulus (semua ayat lancar), status menjadi RECHECK_PASSED
    // Jika recheck TIDAK lulus, status TETAP COMPLETE_WAITING_RECHECK agar santri tetap di halaman recheck
    // PENTING: Tidak mengubah completedVerses atau HafalanAyatStatus saat recheck
    // Data recheck disimpan terpisah di RecheckRecord
    const newStatus = validatedData.allPassed ? "RECHECK_PASSED" : "COMPLETE_WAITING_RECHECK";
    await db.hafalanRecord.update({
      where: { id },
      data: { statusKaca: newStatus },
    });

    // Note: Kita TIDAK mengupdate HafalanAyatStatus saat recheck
    // Hasil recheck hanya disimpan di RecheckRecord untuk tracking history
    // Ini memisahkan data input hafalan dari data recheck

    return NextResponse.json({
      recheckRecord,
      newStatus,
    });
  } catch (error) {
    console.error("Error during recheck:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
