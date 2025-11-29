import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole, requireSession } from "@/lib/authorization";
import {
  generateNIP,
  generateNIS,
  generatePlaceholderEmail,
} from "@/lib/id-generator";
import { generateSimplePassword } from "@/lib/password-policy";

const createUserSchema = z
  .object({
    name: z.string().min(1),
    email: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "TEACHER", "SANTRI", "WALI"]),
    requiresEmail: z.boolean().optional(),
    // Profile specific fields
    nip: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
    nis: z.string().optional(),
    birthDate: z.string().optional(),
    birthPlace: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    teacherId: z.string().cuid().optional(),
    waliId: z.string().cuid().optional(),
    teacherIds: z.array(z.string().cuid()).optional(),
  })
  .refine(
    (data) => {
      // If email is provided, it must be a valid email
      if (data.email && data.email.trim() !== "") {
        return z.string().email().safeParse(data.email).success;
      }
      return true;
    },
    {
      message: "Email must be a valid email address",
      path: ["email"],
    }
  );

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "TEACHER", "SANTRI", "WALI"]).optional(),
  // Profile specific fields
  nip: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  nis: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  teacherId: z.string().cuid().optional(),
  waliId: z.string().cuid().optional(),
  teacherIds: z.array(z.string().cuid()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const teacherId = searchParams.get("teacherId");
    // Use safe parseInt with bounds checking (imported via authorization uses same logic)
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");
    const page = pageStr
      ? Math.max(1, Math.min(parseInt(pageStr, 10) || 1, 1000))
      : 1;
    const limit = limitStr
      ? Math.max(1, Math.min(parseInt(limitStr, 10) || 20, 100))
      : 20;

    const where: any = {};
    if (role) where.role = role;

    // Role-based access control for user data
    // ADMIN: Can see all users
    // TEACHER: Can only see their own santri or santri filtered by their teacherId
    // WALI: Can only see their own children
    // SANTRI: Can only see their own profile

    if (userRole === "TEACHER") {
      // Teacher can only fetch SANTRI data assigned to them
      if (role && role !== "SANTRI") {
        return NextResponse.json(
          { error: "Teachers can only view santri data" },
          { status: 403 }
        );
      }

      // Force role filter to SANTRI for teachers
      where.role = "SANTRI";

      // Get teacher profile ID from user ID
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!teacherProfile) {
        return NextResponse.json(
          { error: "Teacher profile not found" },
          { status: 403 }
        );
      }

      // Filter to only show santri assigned to this teacher
      where.santriProfile = {
        OR: [
          { teacherId: teacherProfile.id },
          {
            teacherAssignments: {
              some: { teacherId: teacherProfile.id },
            },
          },
        ],
      };
    } else if (userRole === "WALI") {
      // Wali can only fetch their children's data
      const waliProfile = await db.waliProfile.findUnique({
        where: { userId: session.user.id },
        include: { santris: { select: { userId: true } } },
      });

      if (!waliProfile) {
        return NextResponse.json(
          { error: "Wali profile not found" },
          { status: 403 }
        );
      }

      // Filter to only show wali's children
      where.id = {
        in: waliProfile.santris.map((s) => s.userId),
      };
    } else if (userRole === "SANTRI") {
      // Santri can only see their own profile
      where.id = session.user.id;
    }
    // ADMIN can see all users (no additional filter)

    // For backward compatibility: if teacherId is provided and user is ADMIN or filtering own santri
    if (teacherId && role === "SANTRI" && userRole === "ADMIN") {
      // Get teacher profile ID from user ID
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: teacherId },
        select: { id: true },
      });

      if (teacherProfile) {
        where.santriProfile = {
          OR: [
            {
              teacherId: teacherProfile.id, // Primary teacher
            },
            {
              teacherAssignments: {
                some: {
                  teacherId: teacherProfile.id, // Assigned teacher
                },
              },
            },
          ],
        };
      }
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          teacherProfile: {
            include: {
              santris: true,
              teacherAssignments: {
                include: {
                  santri: {
                    include: {
                      user: { select: { name: true, email: true } },
                    },
                  },
                },
              },
            },
          },
          waliProfile: {
            include: { santris: true },
          },
          santriProfile: {
            include: {
              teacher: { include: { user: { select: { name: true } } } },
              wali: { include: { user: { select: { name: true } } } },
              teacherAssignments: {
                include: {
                  teacher: {
                    include: { user: { select: { name: true, email: true } } },
                  },
                },
              },
              hafalanRecords: {
                include: {
                  kaca: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    // Remove passwords from response and flatten isActive from profiles
    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user;

      // Extract isActive from the appropriate profile
      let isActive = true; // Default to true for users without profiles
      if (user.teacherProfile) {
        isActive = user.teacherProfile.isActive;
      } else if (user.waliProfile) {
        isActive = user.waliProfile.isActive;
      } else if (user.santriProfile) {
        isActive = user.santriProfile.isActive;
      }

      // Calculate hafalan statistics for santri
      if (userWithoutPassword.santriProfile?.hafalanRecords) {
        const records = userWithoutPassword.santriProfile.hafalanRecords;
        const totalKaca = records.length;
        const completedKaca = records.filter(
          (r: any) => r.statusKaca === "RECHECK_PASSED"
        ).length;
        const inProgressKaca = records.filter(
          (r: any) => r.statusKaca === "PROGRESS"
        ).length;
        const waitingRecheckKaca = records.filter(
          (r: any) => r.statusKaca === "COMPLETE_WAITING_RECHECK"
        ).length;

        // Get last activity date
        const lastActivityAt =
          records.length > 0
            ? records.reduce((latest: any, record: any) => {
                const recordDate = new Date(record.updatedAt);
                return recordDate > new Date(latest)
                  ? record.updatedAt
                  : latest;
              }, records[0].updatedAt)
            : null;

        // Add calculated fields to santriProfile using type-safe approach
        (userWithoutPassword.santriProfile as any).totalKaca = totalKaca;
        (userWithoutPassword.santriProfile as any).completedKaca =
          completedKaca;
        (userWithoutPassword.santriProfile as any).inProgressKaca =
          inProgressKaca;
        (userWithoutPassword.santriProfile as any).waitingRecheckKaca =
          waitingRecheckKaca;
        (userWithoutPassword.santriProfile as any).lastActivityAt =
          lastActivityAt;
      }

      return {
        ...userWithoutPassword,
        isActive, // Add isActive at the top level for easy access
      };
    });

    return NextResponse.json({
      data: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    const requiresEmail =
      validatedData.requiresEmail ?? validatedData.role !== "SANTRI";

    let incomingEmail = validatedData.email;
    if (!incomingEmail) {
      if (validatedData.role === "SANTRI" && !requiresEmail) {
        incomingEmail = generatePlaceholderEmail(validatedData.name);
      } else {
        return NextResponse.json(
          { error: "Email is required for this user" },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: incomingEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const teacherIds = Array.from(
      new Set([
        ...(validatedData.teacherIds || []),
        ...(validatedData.teacherId ? [validatedData.teacherId] : []),
      ])
    );

    if (teacherIds.length > 0) {
      const teachers = await db.teacherProfile.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true },
      });

      if (teachers.length !== teacherIds.length) {
        return NextResponse.json(
          { error: "One or more teachers not found" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user with mustChangePassword flag
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: incomingEmail,
        password: hashedPassword,
        role: validatedData.role,
        mustChangePassword: true, // Force password change on first login
      },
    });

    // Create role-specific profile
    switch (validatedData.role) {
      case "TEACHER":
        await db.teacherProfile.create({
          data: {
            userId: user.id,
            nip: validatedData.nip ?? generateNIP(),
            phone: validatedData.phone,
            address: validatedData.address,
          },
        });
        break;

      case "WALI":
        await db.waliProfile.create({
          data: {
            userId: user.id,
            phone: validatedData.phone,
            address: validatedData.address,
            occupation: validatedData.occupation,
          },
        });
        break;

      case "SANTRI": {
        const santriProfile = await db.santriProfile.create({
          data: {
            userId: user.id,
            nis:
              validatedData.nis ??
              generateNIS(
                validatedData.birthDate
                  ? new Date(validatedData.birthDate)
                  : undefined
              ),
            birthDate: validatedData.birthDate
              ? new Date(validatedData.birthDate)
              : undefined,
            birthPlace: validatedData.birthPlace,
            gender: validatedData.gender,
            address: validatedData.address,
            phone: validatedData.phone,
            teacherId: teacherIds.length > 0 ? teacherIds[0] : undefined,
            waliId: validatedData.waliId || undefined,
          },
        });

        if (teacherIds.length > 0) {
          await db.santriTeacherAssignment.createMany({
            data: teacherIds.map((id) => ({
              santriId: santriProfile.id,
              teacherId: id,
            })),
            skipDuplicates: true,
          });
        }
        break;
      }
    }

    // Fetch created user with profile
    const createdUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
        waliProfile: true,
        santriProfile: {
          include: {
            teacher: { include: { user: { select: { name: true } } } },
            wali: { include: { user: { select: { name: true } } } },
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

    // Remove password from response
    const { password, ...userWithoutPassword } = createdUser!;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
