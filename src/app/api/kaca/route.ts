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

    const where: any = {}
    if (juz) where.juz = parseInt(juz)
    if (surah) where.surahNumber = parseInt(surah)

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