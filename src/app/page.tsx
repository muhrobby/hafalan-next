'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Redirect based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'TEACHER':
          router.push('/teacher')
          break
        case 'WALI':
          router.push('/wali')
          break
        case 'SANTRI':
          router.push('/santri')
          break
        default:
          router.push('/auth/signin')
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Aplikasi Hafalan Al-Qur'an
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistem komprehensif dengan Metode 1 Kaca untuk tracking progress hafalan santri
          </p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/auth/signin">
              Mulai Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                Metode 1 Kaca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fokus pada satu halaman (kaca) hingga sempurna sebelum melanjutkan ke halaman berikutnya.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                Tracking Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor detail progress hafalan per ayat, per surah, dan per kaca dengan grafik interaktif.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">3</span>
                </div>
                Multi-Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dukungan lengkap untuk Admin, Teacher, Santri, dan Wali dengan hak akses yang sesuai.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}