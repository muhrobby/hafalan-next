import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";

const assignSchema = z.object({
  waliId: z.string().cuid("Invalid waliId format"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { waliId } = assignSchema.parse(await request.json());
    const { santriId } = await params;

    const [santri, wali] = await Promise.all([
      db.santriProfile.findUnique({ where: { id: santriId } }),
      db.waliProfile.findUnique({ where: { id: waliId } }),
    ]);

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    if (!wali) {
      return NextResponse.json({ error: "Wali not found" }, { status: 400 });
    }

    const updatedSantri = await db.santriProfile.update({
      where: { id: santriId },
      data: { waliId },
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
