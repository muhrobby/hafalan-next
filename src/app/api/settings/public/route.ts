import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicEndpointLimiter, getClientIp, checkRateLimit } from "@/lib/rate-limiter";

// Default branding settings
const defaultSettings = {
  brandName: "Hafalan Al-Qur'an",
  brandTagline: "Metode 1 Kaca",
  logoUrl: null,
  primaryColor: "#059669",
};

/**
 * Public endpoint to get branding settings
 * No authentication required - used for login page, public pages
 * Rate limited to prevent abuse
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for public endpoint - 30 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResponse = await checkRateLimit(
      publicEndpointLimiter,
      30,
      `public-settings:${clientIp}`
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Try to get existing settings
    const settings = await db.appSettings.findUnique({
      where: { id: "app_settings" },
      select: {
        brandName: true,
        brandTagline: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    // Return settings or defaults
    return NextResponse.json(
      {
        brandName: settings?.brandName || defaultSettings.brandName,
        brandTagline: settings?.brandTagline || defaultSettings.brandTagline,
        logoUrl: settings?.logoUrl || defaultSettings.logoUrl,
        primaryColor: settings?.primaryColor || defaultSettings.primaryColor,
      },
      {
        headers: {
          // Cache for 5 minutes, allow stale for 1 hour
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public settings:", error);
    // Return defaults on error
    return NextResponse.json(defaultSettings);
  }
}
