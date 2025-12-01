import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIS, generatePlaceholderEmail } from "@/lib/id-generator";
import { generateSimplePassword } from "@/lib/password-policy";

interface BulkSantriRow {
  nama_santri: string;
  tgl_lahir: string;
  tempat_lahir: string;
  gender: string;
  alamat: string;
  telp_santri?: string; // Optional - satu-satunya field yang boleh kosong
  nama_wali: string;
  telp_wali: string;
  pekerjaan_wali: string;
  alamat_wali: string;
  email_wali: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  santriName: string;
  waliName: string;
  error?: string;
  santriId?: string;
  waliId?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { data } = body as { data: BulkSantriRow[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Data tidak valid atau kosong" },
        { status: 400 }
      );
    }

    const results: ImportResult[] = [];

    // Cache untuk wali yang sudah dibuat (berdasarkan email)
    const waliCache = new Map<string, string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validasi required fields santri - semua wajib kecuali telp_santri
        const missingFields: string[] = [];

        if (!row.nama_santri?.trim()) missingFields.push("nama_santri");
        if (!row.tgl_lahir?.trim()) missingFields.push("tgl_lahir");
        if (!row.tempat_lahir?.trim()) missingFields.push("tempat_lahir");
        if (!row.gender?.trim()) missingFields.push("gender");
        if (!row.alamat?.trim()) missingFields.push("alamat");

        // Wali opsional - tapi jika ada nama_wali, maka field wali lainnya wajib
        const hasWali = row.nama_wali?.trim();
        if (hasWali) {
          if (!row.telp_wali?.trim()) missingFields.push("telp_wali");
          if (!row.pekerjaan_wali?.trim()) missingFields.push("pekerjaan_wali");
          if (!row.alamat_wali?.trim()) missingFields.push("alamat_wali");
          if (!row.email_wali?.trim()) missingFields.push("email_wali");
        }

        if (missingFields.length > 0) {
          results.push({
            success: false,
            row: rowNumber,
            santriName: row.nama_santri || "N/A",
            waliName: row.nama_wali || "Tanpa Wali",
            error: `Field wajib kosong: ${missingFields.join(", ")}`,
          });
          continue;
        }

        // Normalize gender
        const gender = row.gender.toUpperCase();
        if (gender !== "MALE" && gender !== "FEMALE") {
          results.push({
            success: false,
            row: rowNumber,
            santriName: row.nama_santri,
            waliName: row.nama_wali,
            error: "Gender harus MALE atau FEMALE",
          });
          continue;
        }

        // Parse tanggal lahir (required field - sudah divalidasi di atas)
        const birthDate = new Date(row.tgl_lahir!);
        if (isNaN(birthDate.getTime())) {
          results.push({
            success: false,
            row: rowNumber,
            santriName: row.nama_santri,
            waliName: row.nama_wali,
            error:
              "Format tanggal lahir tidak valid (gunakan format YYYY-MM-DD)",
          });
          continue;
        }

        // Handle Wali (optional - can be null for orphans/yatim piatu)
        let waliProfileId: string | null = null;
        const hasWaliData =
          row.nama_wali?.trim() ||
          row.telp_wali?.trim() ||
          row.pekerjaan_wali?.trim() ||
          row.alamat_wali?.trim() ||
          row.email_wali?.trim();

        if (hasWaliData) {
          const waliEmail = row.email_wali!.trim();

          // Cek cache dulu
          if (waliCache.has(waliEmail)) {
            waliProfileId = waliCache.get(waliEmail)!;
          } else {
            // Cek apakah wali sudah ada di database
            const existingWali = await db.user.findUnique({
              where: { email: waliEmail },
              include: { waliProfile: true },
            });

            if (existingWali && existingWali.waliProfile) {
              waliProfileId = existingWali.waliProfile.id;
            } else if (existingWali && !existingWali.waliProfile) {
              // Email sudah ada tapi bukan wali
              results.push({
                success: false,
                row: rowNumber,
                santriName: row.nama_santri,
                waliName: row.nama_wali,
                error: `Email wali ${waliEmail} sudah digunakan user lain`,
              });
              continue;
            } else {
              // Buat wali baru dengan simple password
              const waliPassword = generateSimplePassword(8);
              const waliHashedPassword = await bcrypt.hash("wali123", 12);
              const waliUser = await db.user.create({
                data: {
                  name: row.nama_wali,
                  email: waliEmail,
                  password: waliHashedPassword,
                  role: "WALI",
                  mustChangePassword: true, // Force password change on first login
                },
              });

              const waliProfile = await db.waliProfile.create({
                data: {
                  userId: waliUser.id,
                  phone: row.telp_wali,
                  occupation: row.pekerjaan_wali,
                  address: row.alamat_wali,
                },
              });

              waliProfileId = waliProfile.id;
            }

            // Simpan ke cache
            waliCache.set(waliEmail, waliProfileId);
          }
        }

        // Buat Santri
        const santriEmail = generatePlaceholderEmail(row.nama_santri);
        const santriNIS = generateNIS(birthDate);

        // Cek apakah email santri sudah ada
        const existingSantri = await db.user.findUnique({
          where: { email: santriEmail },
        });

        if (existingSantri) {
          results.push({
            success: false,
            row: rowNumber,
            santriName: row.nama_santri,
            waliName: row.nama_wali,
            error: "Email santri sudah ada (kemungkinan duplikasi nama)",
          });
          continue;
        }

        // Generate simple password for santri
        const santriPassword = generateSimplePassword(8);
        const santriHashedPassword = await bcrypt.hash("santri123", 12);

        const santriUser = await db.user.create({
          data: {
            name: row.nama_santri,
            email: santriEmail,
            password: santriHashedPassword,
            role: "SANTRI",
            mustChangePassword: true, // Force password change on first login
          },
        });

        const santriProfile = await db.santriProfile.create({
          data: {
            userId: santriUser.id,
            nis: santriNIS,
            birthDate: birthDate,
            birthPlace: row.tempat_lahir,
            gender: gender as "MALE" | "FEMALE",
            address: row.alamat,
            phone: row.telp_santri,
            waliId: waliProfileId ?? undefined,
          },
        });

        results.push({
          success: true,
          row: rowNumber,
          santriName: row.nama_santri,
          waliName: row.nama_wali,
          santriId: santriProfile.id,
          waliId: waliProfileId ?? undefined,
        });
      } catch (err: any) {
        results.push({
          success: false,
          row: rowNumber,
          santriName: row.nama_santri || "N/A",
          waliName: row.nama_wali || "N/A",
          error: err.message || "Terjadi kesalahan",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Import selesai: ${successCount} berhasil, ${failCount} gagal`,
      totalRows: data.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Error bulk import santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
