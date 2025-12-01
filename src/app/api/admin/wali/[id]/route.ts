import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";

const updateWaliSchema = z.object({
  name: z.string().min(1, "Nama wali harus diisi").optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateWaliSchema.parse(body);

    // Check if wali exists
    const existingWali = await db.user.findUnique({
      where: { id, role: "WALI" },
      include: { waliProfile: true },
    });

    if (!existingWali) {
      return NextResponse.json(
        { error: "Wali tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check email uniqueness if changed
    if (validatedData.email && validatedData.email !== existingWali.email) {
      const emailExists = await db.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh user lain" },
          { status: 400 }
        );
      }
    }

    // Update user data
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
      },
    });

    // Update wali profile
    if (existingWali.waliProfile) {
      await db.waliProfile.update({
        where: { userId: id },
        data: {
          phone: validatedData.phone,
          occupation: validatedData.occupation,
          address: validatedData.address,
          isActive: validatedData.isActive,
        },
      });
    } else if (
      validatedData.phone ||
      validatedData.occupation ||
      validatedData.address ||
      validatedData.isActive !== undefined
    ) {
      // Create profile if it doesn't exist but data was provided
      await db.waliProfile.create({
        data: {
          userId: id,
          phone: validatedData.phone || undefined,
          occupation: validatedData.occupation || undefined,
          address: validatedData.address || undefined,
          isActive: validatedData.isActive ?? true,
        },
      });
    }

    // Fetch updated wali with full details
    const updatedWali = await db.user.findUnique({
      where: { id },
      include: {
        waliProfile: {
          include: {
            santris: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    const { password, ...waliWithoutPassword } = updatedWali!;

    return NextResponse.json(waliWithoutPassword);
  } catch (error) {
    console.error("Error updating wali:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const { id } = await params;

    // Check if wali exists
    const existingWali = await db.user.findUnique({
      where: { id, role: "WALI" },
      include: {
        waliProfile: {
          include: { santris: true },
        },
      },
    });

    if (!existingWali) {
      return NextResponse.json(
        { error: "Wali tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if wali has associated santri
    if (
      existingWali.waliProfile?.santris &&
      existingWali.waliProfile.santris.length > 0
    ) {
      return NextResponse.json(
        {
          error: `Wali ini masih memiliki ${existingWali.waliProfile.santris.length} santri yang terhubung. Silakan pindahkan atau hapus hubungan terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Delete wali profile first
    if (existingWali.waliProfile) {
      await db.waliProfile.delete({
        where: { userId: id },
      });
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Wali berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting wali:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");

    const { id } = await params;

    const wali = await db.user.findUnique({
      where: { id, role: "WALI" },
      include: {
        waliProfile: {
          include: {
            santris: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!wali) {
      return NextResponse.json(
        { error: "Wali tidak ditemukan" },
        { status: 404 }
      );
    }

    const { password, ...waliWithoutPassword } = wali;

    return NextResponse.json(waliWithoutPassword);
  } catch (error) {
    console.error("Error fetching wali:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
