import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";

const assignSchema = z.object({
  waliId: z.string().nullable(), // Can be null to unassign
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { waliId } = assignSchema.parse(await request.json());
    const { santriId } = await params;

    // Find santri profile
    const santri = await db.santriProfile.findUnique({
      where: { id: santriId },
    });
    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    let waliProfileId: string | null = null;

    if (waliId) {
      // First try to find waliProfile by id directly
      let waliProfile = await db.waliProfile.findUnique({
        where: { id: waliId },
      });

      // If not found, try to find by userId (in case userId was passed)
      if (!waliProfile) {
        waliProfile = await db.waliProfile.findUnique({
          where: { userId: waliId },
        });
      }

      if (!waliProfile) {
        return NextResponse.json({ error: "Wali not found" }, { status: 400 });
      }

      waliProfileId = waliProfile.id;
    }

    const updatedSantri = await db.santriProfile.update({
      where: { id: santriId },
      data: { waliId: waliProfileId },
      include: {
        user: { select: { name: true, email: true } },
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        wali: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedSantri);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error assigning wali", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
