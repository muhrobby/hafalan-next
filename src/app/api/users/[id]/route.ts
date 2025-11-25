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
  teacherId: z.string().optional().nullable(),
  waliId: z.string().optional().nullable(),
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
          ...(hashedPassword ? { password: hashedPassword } : {}),
          role: newRole,
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
            isActive: payload.isActive ?? undefined,
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
            isActive: payload.isActive ?? undefined,
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
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
