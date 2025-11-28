import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const juz = searchParams.get('juz')
    const surah = searchParams.get('surah')
    const search = searchParams.get('search')

    const where: any = {}
    if (juz) where.juz = parseInt(juz)
    if (surah) where.surahNumber = parseInt(surah)
    if (search) {
      where.surahName = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const [kaca, total] = await Promise.all([
      db.kaca.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { pageNumber: 'asc' }
      }),
      db.kaca.count({ where })
    ])

    return NextResponse.json({
      data: kaca,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching kaca:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new kaca
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create kaca
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { pageNumber, surahNumber, surahName, ayatStart, ayatEnd, juz, description } = body

    // Validate required fields
    if (!pageNumber || !surahNumber || !surahName || !ayatStart || !ayatEnd || !juz) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if page number already exists
    const existing = await db.kaca.findUnique({
      where: { pageNumber: parseInt(pageNumber) }
    })

    if (existing) {
      return NextResponse.json(
        { error: `Halaman ${pageNumber} sudah ada` },
        { status: 409 }
      )
    }

    const kaca = await db.kaca.create({
      data: {
        pageNumber: parseInt(pageNumber),
        surahNumber: parseInt(surahNumber),
        surahName,
        ayatStart: parseInt(ayatStart),
        ayatEnd: parseInt(ayatEnd),
        juz: parseInt(juz),
        description: description || null
      }
    })

    return NextResponse.json(kaca, { status: 201 })
  } catch (error) {
    console.error('Error creating kaca:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}