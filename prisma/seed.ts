import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env
dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

// Sample data for first few pages of Qur'an (Juz 1)
const kacaData = [
  // Juz 1 - Al-Fatihah to Al-Baqarah 141
  {
    pageNumber: 1,
    surahNumber: 1,
    surahName: "Al-Fatihah",
    ayatStart: 1,
    ayatEnd: 7,
    juz: 1,
    description: "Surah Al-Fatihah - Pembukaan"
  },
  {
    pageNumber: 2,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 1,
    ayatEnd: 5,
    juz: 1,
    description: "Al-Baqarah 1-5"
  },
  {
    pageNumber: 3,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 6,
    ayatEnd: 16,
    juz: 1,
    description: "Al-Baqarah 6-16"
  },
  {
    pageNumber: 4,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 17,
    ayatEnd: 25,
    juz: 1,
    description: "Al-Baqarah 17-25"
  },
  {
    pageNumber: 5,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 25,
    ayatEnd: 37,
    juz: 1,
    description: "Al-Baqarah 25-37"
  },
  {
    pageNumber: 6,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 37,
    ayatEnd: 48,
    juz: 1,
    description: "Al-Baqarah 37-48"
  },
  {
    pageNumber: 7,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 48,
    ayatEnd: 61,
    juz: 1,
    description: "Al-Baqarah 48-61"
  },
  {
    pageNumber: 8,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 62,
    ayatEnd: 74,
    juz: 1,
    description: "Al-Baqarah 62-74"
  },
  {
    pageNumber: 9,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 74,
    ayatEnd: 84,
    juz: 1,
    description: "Al-Baqarah 74-84"
  },
  {
    pageNumber: 10,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 84,
    ayatEnd: 92,
    juz: 1,
    description: "Al-Baqarah 84-92"
  },
  {
    pageNumber: 11,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 93,
    ayatEnd: 103,
    juz: 1,
    description: "Al-Baqarah 93-103"
  },
  {
    pageNumber: 12,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 103,
    ayatEnd: 114,
    juz: 1,
    description: "Al-Baqarah 103-114"
  },
  {
    pageNumber: 13,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 114,
    ayatEnd: 125,
    juz: 1,
    description: "Al-Baqarah 114-125"
  },
  {
    pageNumber: 14,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 125,
    ayatEnd: 133,
    juz: 1,
    description: "Al-Baqarah 125-133"
  },
  {
    pageNumber: 15,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 133,
    ayatEnd: 141,
    juz: 1,
    description: "Al-Baqarah 133-141"
  },
  // Juz 2 continuation
  {
    pageNumber: 16,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 142,
    ayatEnd: 151,
    juz: 2,
    description: "Al-Baqarah 142-151"
  },
  {
    pageNumber: 17,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 151,
    ayatEnd: 163,
    juz: 2,
    description: "Al-Baqarah 151-163"
  },
  {
    pageNumber: 18,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 163,
    ayatEnd: 174,
    juz: 2,
    description: "Al-Baqarah 163-174"
  },
  {
    pageNumber: 19,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 174,
    ayatEnd: 183,
    juz: 2,
    description: "Al-Baqarah 174-183"
  },
  {
    pageNumber: 20,
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayatStart: 183,
    ayatEnd: 191,
    juz: 2,
    description: "Al-Baqarah 183-191"
  }
]

async function seedKaca() {
  console.log('🕌 Seeding Kaca (Qur\'an Pages)...')
  
  try {
    // Clear existing kaca data
    await prisma.kaca.deleteMany()
    
    // Insert kaca data
    for (const kaca of kacaData) {
      await prisma.kaca.create({
        data: kaca
      })
    }
    
    console.log(`✅ Successfully seeded ${kacaData.length} kaca pages`)
  } catch (error) {
    console.error('❌ Error seeding kaca:', error)
    throw error
  }
}

async function seedUsers() {
  console.log('👥 Seeding Users...')
  
  try {
    // Clear existing user data
    await prisma.user.deleteMany()
    await prisma.teacherProfile.deleteMany()
    await prisma.waliProfile.deleteMany()
    await prisma.santriProfile.deleteMany()
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@hafalan.com',
        name: 'Administrator',
        password: '$2b$12$1Q1Q/BqJ79fOO7WBaSXcP.CmN/1zBh8a.bx5h03n6yracEbeWkUQK', // password: admin123
        role: 'ADMIN'
      }
    })
    
    // Create teacher user
    const teacherUser = await prisma.user.create({
      data: {
        email: 'teacher@hafalan.com',
        name: 'Ustadz Ahmad',
        password: '$2b$12$L.AYcPDNaRni1EjXXczP/uHUaSxQ29jLYayRfV9V0i.19g4do26KK', // password: teacher123
        role: 'TEACHER'
      }
    })
    
    // Create teacher profile
    const teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        nip: '198001012020121001',
        phone: '+62812345678',
        address: 'Jakarta, Indonesia',
        isActive: true
      }
    })
    
    // Create wali user
    const waliUser = await prisma.user.create({
      data: {
        email: 'wali@hafalan.com',
        name: 'Bapak Ahmad',
        password: '$2b$12$pVg6Qkyit9uHKR6dLzRPROnYMVF0hNm.pOxEv2jNLhmEl4Q79MX9O', // password: wali123
        role: 'WALI'
      }
    })
    
    // Create wali profile
    const waliProfile = await prisma.waliProfile.create({
      data: {
        userId: waliUser.id,
        phone: '+62812345679',
        address: 'Jakarta, Indonesia',
        occupation: 'Pegawai Swasta',
        isActive: true
      }
    })
    
    // Create santri user
    const santriUser = await prisma.user.create({
      data: {
        email: 'santri@hafalan.com',
        name: 'Muhammad Ali',
        password: '$2b$12$z8K2mZhTTKghyarlKbgBCud51xlTmYntls/GZIESax4f7PRks3f/C', // password: santri123
        role: 'SANTRI'
      }
    })
    
    // Create santri profile
    const santriProfile = await prisma.santriProfile.create({
      data: {
        userId: santriUser.id,
        nis: '2024001',
        birthDate: new Date('2010-01-15'),
        birthPlace: 'Jakarta',
        gender: 'MALE',
        address: 'Jakarta, Indonesia',
        phone: '+62812345680',
        isActive: true,
        joinDate: new Date('2024-01-01'),
        teacherId: teacherProfile.id,
        waliId: waliProfile.id
      }
    })
    
    console.log('✅ Successfully seeded users:')
    console.log(`   - Admin: ${adminUser.email} (password: admin123)`)
    console.log(`   - Teacher: ${teacherUser.email} (password: teacher123)`)
    console.log(`   - Wali: ${waliUser.email} (password: wali123)`)
    console.log(`   - Santri: ${santriUser.email} (password: santri123)`)
    
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting database seed...')
  
  // Log env status
  console.log('📋 Environment Check:')
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`)
  console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? '✓' : '✗'}`)
  console.log('')
  
  try {
    // Test connection
    console.log('🔗 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Database connection successful')
    console.log('')
    
    await seedKaca()
    await seedUsers()
    
    console.log('🎉 Database seeded successfully!')
  } catch (error) {
    console.error('💥 Error during seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()