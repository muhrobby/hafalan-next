import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { passwordSchema } from "@/lib/password-policy";
import { loginLimiter, getClientIp } from "@/lib/rate-limiter";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama harus diisi"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru dan konfirmasi tidak sama",
    path: ["confirmPassword"],
  });

const forceChangePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru dan konfirmasi tidak sama",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    try {
      await loginLimiter.check(5, `change-password:${clientIp}`);
    } catch {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const isForceChange = session.user.mustChangePassword;

    // Use different validation schema for force change vs normal change
    if (isForceChange) {
      const validatedData = forceChangePasswordSchema.parse(body);

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

      // Update password and remove force change flag
      await db.user.update({
        where: { id: session.user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password berhasil diubah",
      });
    } else {
      const validatedData = changePasswordSchema.parse(body);

      // Get current user
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Password lama tidak sesuai" },
          { status: 400 }
        );
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(
        validatedData.newPassword,
        user.password
      );

      if (isSamePassword) {
        return NextResponse.json(
          { error: "Password baru tidak boleh sama dengan password lama" },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

      // Update password
      await db.user.update({
        where: { id: session.user.id },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password berhasil diubah",
      });
    }
  } catch (error) {
    console.error("Error changing password:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengubah password" },
      { status: 500 }
    );
  }
}
