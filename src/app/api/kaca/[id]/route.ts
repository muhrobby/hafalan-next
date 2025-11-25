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
