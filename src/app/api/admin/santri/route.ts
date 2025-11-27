import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIS, generatePlaceholderEmail } from "@/lib/id-generator";

// Schema untuk create santri dengan optional wali baru
const createSantriSchema = z.object({
  // Data Santri
  name: z.string().min(1, "Nama santri harus diisi"),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  
  // Data Wali (optional - bisa pilih existing atau buat baru)
  waliId: z.string().optional(), // Pilih wali yang sudah ada
  createNewWali: z.boolean().optional(), // Flag untuk buat wali baru
  waliData: z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validatedData = createSantriSchema.parse(body);

    let waliProfileId: string | undefined = validatedData.waliId;

    // Jika perlu buat wali baru
    if (validatedData.createNewWali && validatedData.waliData) {
      const waliEmail = validatedData.waliData.email || 
        generatePlaceholderEmail(validatedData.waliData.name);
      
      // Check if wali email already exists
      const existingWaliUser = await db.user.findUnique({
        where: { email: waliEmail },
        include: { waliProfile: true }
      });

      if (existingWaliUser) {
        if (existingWaliUser.waliProfile) {
          // Gunakan wali yang sudah ada
          waliProfileId = existingWaliUser.waliProfile.id;
        } else {
          return NextResponse.json(
            { error: "Email sudah digunakan oleh user lain yang bukan wali" },
            { status: 400 }
          );
        }
      } else {
        // Buat wali baru
        const hashedPassword = await bcrypt.hash("wali123", 12);
        const waliUser = await db.user.create({
          data: {
            name: validatedData.waliData.name,
            email: waliEmail,
            password: hashedPassword,
            role: "WALI",
          },
        });

        const waliProfile = await db.waliProfile.create({
          data: {
            userId: waliUser.id,
            phone: validatedData.waliData.phone,
            occupation: validatedData.waliData.occupation,
            address: validatedData.waliData.address,
          },
        });

        waliProfileId = waliProfile.id;
      }
    }

    // Generate email dan NIS untuk santri
    const santriEmail = generatePlaceholderEmail(validatedData.name);
    const santriNIS = generateNIS(
      validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
    );

    // Hash password default
    const hashedPassword = await bcrypt.hash("santri123", 12);

    // Create santri user
    const santriUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: santriEmail,
        password: hashedPassword,
        role: "SANTRI",
      },
    });

    // Create santri profile
    const santriProfile = await db.santriProfile.create({
      data: {
        userId: santriUser.id,
        nis: santriNIS,
        birthDate: validatedData.birthDate
          ? new Date(validatedData.birthDate)
          : undefined,
        birthPlace: validatedData.birthPlace,
        gender: validatedData.gender,
        address: validatedData.address,
        phone: validatedData.phone,
        waliId: waliProfileId,
      },
    });

    // Fetch created santri with all relationships
    const createdSantri = await db.user.findUnique({
      where: { id: santriUser.id },
      include: {
        santriProfile: {
          include: {
            wali: {
              include: { user: { select: { name: true, email: true } } },
            },
            teacherAssignments: {
              include: {
                teacher: {
                  include: { user: { select: { name: true, email: true } } },
                },
              },
            },
          },
        },
      },
    });

    const { password, ...santriWithoutPassword } = createdSantri!;

    return NextResponse.json(santriWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating santri:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
