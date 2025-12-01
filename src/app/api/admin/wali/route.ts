import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generatePlaceholderEmail } from "@/lib/id-generator";

const createWaliSchema = z.object({
  name: z.string().min(1, "Nama wali harus diisi"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validatedData = createWaliSchema.parse(body);

    // Generate email if not provided
    const waliEmail =
      validatedData.email || generatePlaceholderEmail(validatedData.name);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: waliEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 400 }
      );
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash("wali123", 12);

    // Create wali user
    const waliUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: waliEmail,
        password: hashedPassword,
        role: "WALI",
        mustChangePassword: true,
      },
    });

    // Create wali profile
    const waliProfile = await db.waliProfile.create({
      data: {
        userId: waliUser.id,
        phone: validatedData.phone || undefined,
        occupation: validatedData.occupation || undefined,
        address: validatedData.address || undefined,
      },
    });

    // Fetch created wali with profile
    const createdWali = await db.user.findUnique({
      where: { id: waliUser.id },
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

    const { password, ...waliWithoutPassword } = createdWali!;

    return NextResponse.json(
      {
        ...waliWithoutPassword,
        defaultPassword: "wali123",
        message: "Wali berhasil dibuat. Password default: wali123",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating wali:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
