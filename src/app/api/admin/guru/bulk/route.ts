import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/authorization";
import { generateNIP, generatePlaceholderEmail } from "@/lib/id-generator";

interface BulkGuruRow {
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  name: string;
  error?: string;
  guruId?: string;
  nip?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await request.json();
    const { data } = body as { data: BulkGuruRow[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Data tidak valid atau kosong" },
        { status: 400 }
      );
    }

    const results: ImportResult[] = [];
    const defaultPassword = await bcrypt.hash("guru123", 12);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validasi required fields
        if (!row.nama) {
          results.push({
            success: false,
            row: rowNumber,
            name: row.nama || "N/A",
            error: "Nama guru harus diisi",
          });
          continue;
        }

        // Generate email jika tidak ada
        const guruEmail = row.email || generatePlaceholderEmail(row.nama);

        // Cek apakah email sudah ada
        const existingUser = await db.user.findUnique({
          where: { email: guruEmail },
        });

        if (existingUser) {
          results.push({
            success: false,
            row: rowNumber,
            name: row.nama,
            error: `Email ${guruEmail} sudah digunakan`,
          });
          continue;
        }

        // Generate NIP
        const guruNIP = generateNIP();

        // Buat guru
        const guruUser = await db.user.create({
          data: {
            name: row.nama,
            email: guruEmail,
            password: defaultPassword,
            role: "TEACHER",
          },
        });

        const teacherProfile = await db.teacherProfile.create({
          data: {
            userId: guruUser.id,
            nip: guruNIP,
            phone: row.telepon,
            address: row.alamat,
          },
        });

        results.push({
          success: true,
          row: rowNumber,
          name: row.nama,
          guruId: teacherProfile.id,
          nip: guruNIP,
        });
      } catch (err: any) {
        results.push({
          success: false,
          row: rowNumber,
          name: row.nama || "N/A",
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
    console.error("Error bulk import guru:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
