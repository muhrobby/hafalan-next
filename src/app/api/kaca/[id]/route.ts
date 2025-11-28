import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const body = await request.json();
    const { pageNumber, surahNumber, surahName, ayatStart, ayatEnd, juz, description } = body;

    // Check if kaca exists
    const existing = await db.kaca.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kaca not found" }, { status: 404 });
    }

    // Check if new page number conflicts with another kaca
    if (pageNumber !== existing.pageNumber) {
      const conflict = await db.kaca.findUnique({
        where: { pageNumber: parseInt(pageNumber) },
      });

      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Halaman ${pageNumber} sudah digunakan` },
          { status: 409 }
        );
      }
    }

    const kaca = await db.kaca.update({
      where: { id },
      data: {
        pageNumber: parseInt(pageNumber),
        surahNumber: parseInt(surahNumber),
        surahName,
        ayatStart: parseInt(ayatStart),
        ayatEnd: parseInt(ayatEnd),
        juz: parseInt(juz),
        description: description || null,
      },
    });

    return NextResponse.json(kaca);
  } catch (error) {
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
          error: "Tidak dapat menghapus kaca yang memiliki data hafalan terkait",
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
