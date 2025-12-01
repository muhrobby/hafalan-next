import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIS, generatePlaceholderEmail } from "@/lib/id-generator";
import { generateSimplePassword } from "@/lib/password-policy";

// Schema untuk create santri dengan optional wali (untuk yatim piatu)
const createSantriSchema = z
  .object({
    // Data Santri - semua wajib kecuali phone
    name: z.string().min(1, "Nama santri harus diisi"),
    birthDate: z.string().min(1, "Tanggal lahir harus diisi"),
    birthPlace: z.string().min(1, "Tempat lahir harus diisi"),
    gender: z.enum(["MALE", "FEMALE"], { message: "Gender harus dipilih" }),
    address: z.string().min(1, "Alamat harus diisi"),
    phone: z.string().optional(), // Satu-satunya field opsional untuk santri

    // Data Wali (opsional - bisa tanpa wali untuk yatim piatu)
    waliId: z.string().optional(), // Pilih wali yang sudah ada
    createNewWali: z.boolean().optional(), // Flag untuk buat wali baru
    waliData: z
      .object({
        name: z.string().min(1, "Nama wali harus diisi"),
        phone: z.string().min(1, "Telepon wali harus diisi"),
        occupation: z.string().min(1, "Pekerjaan wali harus diisi"),
        address: z.string().min(1, "Alamat wali harus diisi"),
        email: z.string().min(1, "Email wali harus diisi"),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Jika createNewWali true, waliData harus ada
      if (data.createNewWali && !data.waliData) {
        return false;
      }
      return true;
    },
    { message: "Data wali harus diisi jika membuat wali baru" }
  );

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validatedData = createSantriSchema.parse(body);

    let waliProfileId: string | undefined = validatedData.waliId;

    // Jika perlu buat wali baru
    if (validatedData.createNewWali && validatedData.waliData) {
      const waliEmail = validatedData.waliData.email; // Email wajib diisi

      // Check if wali email already exists
      const existingWaliUser = await db.user.findUnique({
        where: { email: waliEmail },
        include: { waliProfile: true },
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
        // Buat wali baru dengan simple password
        const simplePassword = generateSimplePassword(8);
        const hashedPassword = await bcrypt.hash("wali123", 12);
        const waliUser = await db.user.create({
          data: {
            name: validatedData.waliData.name,
            email: waliEmail,
            password: hashedPassword,
            role: "WALI",
            mustChangePassword: true, // Force password change on first login
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

    // Hash password default (simple 8 digit)
    const simplePassword = generateSimplePassword(8);
    const hashedPassword = await bcrypt.hash("santri123", 12);

    // Create santri user with mustChangePassword flag
    const santriUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: santriEmail,
        password: hashedPassword,
        role: "SANTRI",
        mustChangePassword: true, // Force password change on first login
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

    // Return response with default password (shown only once to admin)
    return NextResponse.json(
      {
        ...santriWithoutPassword,
        defaultPassword: simplePassword, // Show once for admin to share with user
        message: `Santri berhasil dibuat. Password default: ${simplePassword}`,
      },
      { status: 201 }
    );
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
