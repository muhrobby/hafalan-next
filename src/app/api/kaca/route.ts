import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { safeParseInt } from "@/lib/rate-limiter";

// Zod schemas for validation
const createKacaSchema = z.object({
  pageNumber: z.number().int().min(1).max(604),
  surahNumber: z.number().int().min(1).max(114),
  surahName: z.string().min(1).max(100),
  ayatStart: z.number().int().min(1),
  ayatEnd: z.number().int().min(1),
  juz: z.number().int().min(1).max(30),
  description: z.string().max(500).optional().nullable(),
}).refine(data => data.ayatEnd >= data.ayatStart, {
  message: "ayatEnd must be greater than or equal to ayatStart",
  path: ["ayatEnd"],
});

// In-memory cache for kaca data (static data that rarely changes)
let kacaCache: {
  data: any[] | null;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
} = {
  data: null,
  timestamp: 0,
  ttl: 60 * 60 * 1000, // 1 hour cache
};

// Function to get all kaca with caching
async function getAllKacaCached() {
  const now = Date.now();

  // Return cached data if valid
  if (kacaCache.data && now - kacaCache.timestamp < kacaCache.ttl) {
    return kacaCache.data;
  }

  // Fetch fresh data
  const allKaca = await db.kaca.findMany({
    orderBy: { pageNumber: "asc" },
    select: {
      id: true,
      pageNumber: true,
      surahName: true,
      surahNumber: true,
      ayatStart: true,
      ayatEnd: true,
      juz: true,
    },
  });

  // Update cache
  kacaCache.data = allKaca;
  kacaCache.timestamp = now;

  return allKaca;
}

// Invalidate cache when data changes
function invalidateKacaCache() {
  kacaCache.data = null;
  kacaCache.timestamp = 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Use safe parseInt with bounds checking
    const page = safeParseInt(searchParams.get("page"), 1, 1, 1000);
    const limit = safeParseInt(searchParams.get("limit"), 20, 1, 100);
    const juz = searchParams.get("juz");
    const surah = searchParams.get("surah");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true"; // New param for fetching all with cache

    // If requesting all kaca (for dropdowns), use cached data
    if (all || limit >= 600) {
      const allKaca = await getAllKacaCached();

      // Apply client-side filtering if needed
      let filteredKaca = allKaca;

      if (juz) {
        const juzNum = safeParseInt(juz, 0, 1, 30);
        if (juzNum > 0) {
          filteredKaca = filteredKaca.filter((k: any) => k.juz === juzNum);
        }
      }
      if (surah) {
        const surahNum = safeParseInt(surah, 0, 1, 114);
        if (surahNum > 0) {
          filteredKaca = filteredKaca.filter((k: any) => k.surahNumber === surahNum);
        }
      }
      if (search) {
        // Sanitize search input - remove special regex characters
        const searchLower = search.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '');
        filteredKaca = filteredKaca.filter((k: any) =>
          k.surahName.toLowerCase().includes(searchLower)
        );
      }

      return NextResponse.json(
        {
          data: filteredKaca,
          pagination: {
            page: 1,
            limit: filteredKaca.length,
            total: filteredKaca.length,
            totalPages: 1,
          },
          cached: true,
        },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    // Standard paginated query
    const where: any = {};
    if (juz) {
      const juzNum = safeParseInt(juz, 0, 1, 30);
      if (juzNum > 0) where.juz = juzNum;
    }
    if (surah) {
      const surahNum = safeParseInt(surah, 0, 1, 114);
      if (surahNum > 0) where.surahNumber = surahNum;
    }
    if (search) {
      // Sanitize search input
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '');
      where.surahName = {
        contains: sanitizedSearch,
        mode: "insensitive",
      };
    }

    const [kaca, total] = await Promise.all([
      db.kaca.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { pageNumber: "asc" },
        select: {
          id: true,
          pageNumber: true,
          surahName: true,
          surahNumber: true,
          ayatStart: true,
          ayatEnd: true,
          juz: true,
        },
      }),
      db.kaca.count({ where }),
    ]);

    return NextResponse.json({
      data: kaca,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching kaca:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new kaca
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create kaca
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Transform string numbers to actual numbers for validation
    const dataToValidate = {
      pageNumber: typeof body.pageNumber === 'string' ? parseInt(body.pageNumber, 10) : body.pageNumber,
      surahNumber: typeof body.surahNumber === 'string' ? parseInt(body.surahNumber, 10) : body.surahNumber,
      surahName: body.surahName,
      ayatStart: typeof body.ayatStart === 'string' ? parseInt(body.ayatStart, 10) : body.ayatStart,
      ayatEnd: typeof body.ayatEnd === 'string' ? parseInt(body.ayatEnd, 10) : body.ayatEnd,
      juz: typeof body.juz === 'string' ? parseInt(body.juz, 10) : body.juz,
      description: body.description || null,
    };

    // Validate with Zod
    const validatedData = createKacaSchema.parse(dataToValidate);

    // Check if page number already exists
    const existing = await db.kaca.findUnique({
      where: { pageNumber: validatedData.pageNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Halaman ${validatedData.pageNumber} sudah ada` },
        { status: 409 }
      );
    }

    const kaca = await db.kaca.create({
      data: validatedData,
    });

    // Invalidate cache after creating new kaca
    invalidateKacaCache();

    return NextResponse.json(kaca, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating kaca:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
