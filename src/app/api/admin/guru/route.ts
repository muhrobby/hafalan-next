import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIP, generatePlaceholderEmail } from "@/lib/id-generator";

// Schema untuk create guru
const createGuruSchema = z.object({
  name: z.string().min(1, "Nama guru harus diisi"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validatedData = createGuruSchema.parse(body);

    // Generate email jika tidak ada
    const guruEmail = validatedData.email || generatePlaceholderEmail(validatedData.name);
    
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: guruEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 400 }
      );
    }

    // Generate NIP
    const guruNIP = generateNIP();

    // Hash password default
    const hashedPassword = await bcrypt.hash("guru123", 12);

    // Create guru user
    const guruUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: guruEmail,
        password: hashedPassword,
        role: "TEACHER",
      },
    });

    // Create teacher profile
    const teacherProfile = await db.teacherProfile.create({
      data: {
        userId: guruUser.id,
        nip: guruNIP,
        phone: validatedData.phone,
        address: validatedData.address,
      },
    });

    // Fetch created guru with relationships
    const createdGuru = await db.user.findUnique({
      where: { id: guruUser.id },
      include: {
        teacherProfile: {
          include: {
            teacherAssignments: {
              include: {
                santri: {
                  include: { user: { select: { name: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    const { password, ...guruWithoutPassword } = createdGuru!;

    return NextResponse.json(guruWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating guru:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
