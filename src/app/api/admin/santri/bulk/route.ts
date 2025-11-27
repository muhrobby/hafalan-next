import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIS, generatePlaceholderEmail } from "@/lib/id-generator";

interface BulkSantriRow {
  nama_santri: string;
  tgl_lahir?: string;
  tempat_lahir?: string;
  gender: string;
  alamat?: string;
  telp_santri?: string;
  nama_wali: string;
  telp_wali?: string;
  pekerjaan_wali?: string;
  alamat_wali?: string;
  email_wali?: string;
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
    const defaultPassword = await bcrypt.hash("santri123", 12);
    const waliDefaultPassword = await bcrypt.hash("wali123", 12);

    // Cache untuk wali yang sudah dibuat (berdasarkan email)
    const waliCache = new Map<string, string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validasi required fields
        if (!row.nama_santri || !row.gender || !row.nama_wali) {
          results.push({
            success: false,
            row: rowNumber,
            santriName: row.nama_santri || "N/A",
            waliName: row.nama_wali || "N/A",
            error: "Field wajib tidak lengkap (nama_santri, gender, nama_wali)",
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

        // Parse tanggal lahir
        let birthDate: Date | undefined;
        if (row.tgl_lahir) {
          birthDate = new Date(row.tgl_lahir);
          if (isNaN(birthDate.getTime())) {
            results.push({
              success: false,
              row: rowNumber,
              santriName: row.nama_santri,
              waliName: row.nama_wali,
              error: "Format tanggal lahir tidak valid",
            });
            continue;
          }
        }

        // Handle Wali
        let waliProfileId: string;
        const waliEmail = row.email_wali || generatePlaceholderEmail(row.nama_wali);

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
            // Buat wali baru
            const waliUser = await db.user.create({
              data: {
                name: row.nama_wali,
                email: waliEmail,
                password: waliDefaultPassword,
                role: "WALI",
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

        const santriUser = await db.user.create({
          data: {
            name: row.nama_santri,
            email: santriEmail,
            password: defaultPassword,
            role: "SANTRI",
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
            waliId: waliProfileId,
          },
        });

        results.push({
          success: true,
          row: rowNumber,
          santriName: row.nama_santri,
          waliName: row.nama_wali,
          santriId: santriProfile.id,
          waliId: waliProfileId,
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
