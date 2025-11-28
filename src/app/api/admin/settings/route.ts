import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSettingsSchema = z.object({
  brandName: z.string().min(1).max(100).optional(),
  brandTagline: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  menuDashboard: z.boolean().optional(),
  menuHafalan: z.boolean().optional(),
  menuRecheck: z.boolean().optional(),
  menuRaport: z.boolean().optional(),
  menuSantriLookup: z.boolean().optional(),
  menuAnalytics: z.boolean().optional(),
  menuUsers: z.boolean().optional(),
  menuSettings: z.boolean().optional(),
});

// Get app settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get existing settings, or create default
    let settings = await db.appSettings.findUnique({
      where: { id: "app_settings" },
    });

    if (!settings) {
      // Create default settings
      settings = await db.appSettings.create({
        data: {
          id: "app_settings",
          brandName: "Hafalan Al-Qur'an",
          brandTagline: "Metode 1 Kaca",
          primaryColor: "#059669",
          menuDashboard: true,
          menuHafalan: true,
          menuRecheck: true,
          menuRaport: true,
          menuSantriLookup: true,
          menuAnalytics: true,
          menuUsers: true,
          menuSettings: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update app settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Upsert settings
    const settings = await db.appSettings.upsert({
      where: { id: "app_settings" },
      create: {
        id: "app_settings",
        brandName: validatedData.brandName || "Hafalan Al-Qur'an",
        brandTagline: validatedData.brandTagline || "Metode 1 Kaca",
        logoUrl: validatedData.logoUrl,
        primaryColor: validatedData.primaryColor || "#059669",
        menuDashboard: validatedData.menuDashboard ?? true,
        menuHafalan: validatedData.menuHafalan ?? true,
        menuRecheck: validatedData.menuRecheck ?? true,
        menuRaport: validatedData.menuRaport ?? true,
        menuSantriLookup: validatedData.menuSantriLookup ?? true,
        menuAnalytics: validatedData.menuAnalytics ?? true,
        menuUsers: validatedData.menuUsers ?? true,
        menuSettings: validatedData.menuSettings ?? true,
      },
      update: validatedData,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
