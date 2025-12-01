import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Zod schema for ID validation (UUID format)
const idSchema = z.string().cuid("Invalid ID format");

// Zod schema for kaca update
const updateKacaSchema = z
  .object({
    pageNumber: z.number().int().min(1).max(604),
    surahNumber: z.number().int().min(1).max(114),
    surahName: z.string().min(1).max(100),
    ayatStart: z.number().int().min(1),
    ayatEnd: z.number().int().min(1),
    juz: z.number().int().min(1).max(30),
    description: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.ayatEnd >= data.ayatStart, {
    message: "ayatEnd must be greater than or equal to ayatStart",
    path: ["ayatEnd"],
  });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ID format
    const validationResult = idSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const kaca = await db.kaca.findUnique({
      where: { id },
    });

    if (!kaca) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    return NextResponse.json(kaca);
  } catch (error) {
    console.error("Error fetching kaca:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update kaca
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can update kaca
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await request.json();

    // Transform string numbers to actual numbers for validation
    const dataToValidate = {
      pageNumber:
        typeof body.pageNumber === "string"
          ? parseInt(body.pageNumber, 10)
          : body.pageNumber,
      surahNumber:
        typeof body.surahNumber === "string"
          ? parseInt(body.surahNumber, 10)
          : body.surahNumber,
      surahName: body.surahName,
      ayatStart:
        typeof body.ayatStart === "string"
          ? parseInt(body.ayatStart, 10)
          : body.ayatStart,
      ayatEnd:
        typeof body.ayatEnd === "string"
          ? parseInt(body.ayatEnd, 10)
          : body.ayatEnd,
      juz: typeof body.juz === "string" ? parseInt(body.juz, 10) : body.juz,
      description: body.description || null,
    };

    // Validate with Zod
    const validatedData = updateKacaSchema.parse(dataToValidate);

    // Check if kaca exists
    const existing = await db.kaca.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    // Check if new page number conflicts with another kaca
    if (validatedData.pageNumber !== existing.pageNumber) {
      const conflict = await db.kaca.findUnique({
        where: { pageNumber: validatedData.pageNumber },
      });

      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Halaman ${validatedData.pageNumber} sudah digunakan` },
          { status: 409 }
        );
      }
    }

    const kaca = await db.kaca.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(kaca);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating kaca:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete kaca
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete kaca
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Validate ID format
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if kaca exists
    const existing = await db.kaca.findUnique({
      where: { id },
      include: {
        hafalanRecords: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    // Check if kaca has related hafalan records
    if (existing.hafalanRecords.length > 0) {
      return NextResponse.json(
        {
          error:
            "Tidak dapat menghapus kaca yang memiliki data hafalan terkait",
        },
        { status: 409 }
      );
    }

    await db.kaca.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kaca deleted successfully" });
  } catch (error) {
    console.error("Error deleting kaca:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
