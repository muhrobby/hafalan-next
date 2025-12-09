import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authorization";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Gender, UserRole } from "@prisma/client";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
  nip: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  nis: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  teacherId: z.string().cuid().optional().nullable(),
  waliId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

const userInclude = {
  teacherProfile: {
    include: { santris: true },
  },
  waliProfile: {
    include: { santris: true },
  },
  santriProfile: {
    include: {
      teacher: { include: { user: { select: { name: true, email: true } } } },
      wali: { include: { user: { select: { name: true, email: true } } } },
    },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...payload } = user;
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const payload = updateUserSchema.parse(body);
    const { id } = await params;

    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        waliProfile: true,
        santriProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newRole = payload.role ?? existingUser.role;
    const hashedPassword = payload.password
      ? await bcrypt.hash(payload.password, 12)
      : undefined;
    const sanitizedTeacherId =
      payload.teacherId && payload.teacherId.trim() !== ""
        ? payload.teacherId
        : null;
    const sanitizedWaliId =
      payload.waliId && payload.waliId.trim() !== "" ? payload.waliId : null;

    if (sanitizedTeacherId) {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { id: sanitizedTeacherId },
      });
      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 400 }
        );
      }
    }

    if (sanitizedWaliId) {
      const waliProfile = await db.waliProfile.findUnique({
        where: { id: sanitizedWaliId },
      });
      if (!waliProfile) {
        return NextResponse.json({ error: "Wali not found" }, { status: 400 });
      }
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name: payload.name ?? existingUser.name,
          email: payload.email ?? existingUser.email,
          ...(hashedPassword
            ? { password: hashedPassword, mustChangePassword: true }
            : {}),
          role: newRole,
          isActive: payload.isActive ?? existingUser.isActive,
        },
      });

      if (existingUser.teacherProfile && newRole !== "TEACHER") {
        await tx.santriProfile.updateMany({
          where: { teacherId: existingUser.teacherProfile.id },
          data: { teacherId: null },
        });
        await tx.teacherProfile.delete({
          where: { id: existingUser.teacherProfile.id },
        });
      }

      if (existingUser.waliProfile && newRole !== "WALI") {
        await tx.santriProfile.updateMany({
          where: { waliId: existingUser.waliProfile.id },
          data: { waliId: null },
        });
        await tx.waliProfile.delete({
          where: { id: existingUser.waliProfile.id },
        });
      }

      if (existingUser.santriProfile && newRole !== "SANTRI") {
        await tx.hafalanRecord.deleteMany({
          where: { santriId: existingUser.santriProfile.id },
        });
        await tx.santriProfile.delete({
          where: { id: existingUser.santriProfile.id },
        });
      }

      if (newRole === "TEACHER") {
        await tx.teacherProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            nip: payload.nip,
            phone: payload.phone,
            address: payload.address,
          },
          update: {
            nip: payload.nip ?? undefined,
            phone: payload.phone ?? undefined,
            address: payload.address ?? undefined,
          },
        });
      }

      if (newRole === "WALI") {
        await tx.waliProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            phone: payload.phone,
            address: payload.address,
            occupation: payload.occupation,
          },
          update: {
            phone: payload.phone ?? undefined,
            address: payload.address ?? undefined,
            occupation: payload.occupation ?? undefined,
          },
        });
      }

      if (newRole === "SANTRI") {
        await tx.santriProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            nis: payload.nis,
            birthDate: payload.birthDate
              ? new Date(payload.birthDate)
              : undefined,
            birthPlace: payload.birthPlace,
            gender: payload.gender ?? undefined,
            address: payload.address,
            phone: payload.phone,
            teacherId: sanitizedTeacherId ?? undefined,
            waliId: sanitizedWaliId ?? undefined,
          },
          update: {
            nis: payload.nis ?? undefined,
            birthDate: payload.birthDate
              ? new Date(payload.birthDate)
              : undefined,
            birthPlace: payload.birthPlace ?? undefined,
            gender:
              payload.gender ?? existingUser.santriProfile?.gender ?? undefined,
            address: payload.address ?? undefined,
            phone: payload.phone ?? undefined,
            teacherId: sanitizedTeacherId ?? undefined,
            waliId: sanitizedWaliId ?? undefined,
            isActive: payload.isActive ?? undefined,
          },
        });
      }
    });

    const updatedUser = await db.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...result } = updatedUser;
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating user", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    // Check if user exists and get their role
    const user = await db.user.findUnique({
      where: { id },
      include: {
        santriProfile: true,
        teacherProfile: true,
        waliProfile: {
          include: { santris: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting admin
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin user" },
        { status: 400 }
      );
    }

    // Check if wali has associated santri
    if (user.waliProfile?.santris && user.waliProfile.santris.length > 0) {
      return NextResponse.json(
        {
          error: `Wali ini masih memiliki ${user.waliProfile.santris.length} santri. Silakan pindahkan terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Use transaction to delete all related data
    await db.$transaction(async (tx) => {
      // If santri, delete hafalan records and related data first
      if (user.santriProfile) {
        const santriProfileId = user.santriProfile.id;

        // Delete partial hafalan
        await tx.partialHafalan.deleteMany({
          where: { santriId: santriProfileId },
        });

        // Delete teacher assignments
        await tx.santriTeacherAssignment.deleteMany({
          where: { santriId: santriProfileId },
        });

        // Get all hafalan records
        const hafalanRecords = await tx.hafalanRecord.findMany({
          where: { santriId: santriProfileId },
          select: { id: true },
        });

        const hafalanIds = hafalanRecords.map((h) => h.id);

        if (hafalanIds.length > 0) {
          // Delete hafalan ayat statuses
          await tx.hafalanAyatStatus.deleteMany({
            where: { hafalanRecordId: { in: hafalanIds } },
          });

          // Delete recheck records
          await tx.recheckRecord.deleteMany({
            where: { hafalanRecordId: { in: hafalanIds } },
          });

          // Delete hafalan history
          await tx.hafalanHistory.deleteMany({
            where: { hafalanRecordId: { in: hafalanIds } },
          });

          // Delete hafalan records
          await tx.hafalanRecord.deleteMany({
            where: { santriId: santriProfileId },
          });
        }

        // Delete santri profile
        await tx.santriProfile.delete({
          where: { id: santriProfileId },
        });
      }

      // If teacher, clear references first
      if (user.teacherProfile) {
        const teacherProfileId = user.teacherProfile.id;

        // Clear teacher reference from santri profiles
        await tx.santriProfile.updateMany({
          where: { teacherId: teacherProfileId },
          data: { teacherId: null },
        });

        // Delete teacher assignments
        await tx.santriTeacherAssignment.deleteMany({
          where: { teacherId: teacherProfileId },
        });

        // Clear teacher reference from hafalan records (don't delete records)
        await tx.hafalanRecord.updateMany({
          where: { teacherId: teacherProfileId },
          data: { teacherId: null },
        });

        // Delete hafalan history records (required teacherId means we must delete)
        await tx.hafalanHistory.deleteMany({
          where: { teacherId: teacherProfileId },
        });

        // Clear teacher reference from partial hafalan
        await tx.partialHafalan.updateMany({
          where: { teacherId: teacherProfileId },
          data: { teacherId: null },
        });

        // Delete teacher profile
        await tx.teacherProfile.delete({
          where: { id: teacherProfileId },
        });
      }

      // If wali, delete wali profile (already checked no santri attached)
      if (user.waliProfile) {
        await tx.waliProfile.delete({
          where: { id: user.waliProfile.id },
        });
      }

      // Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user", error);
    return NextResponse.json(
      { error: "Gagal menghapus user. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
