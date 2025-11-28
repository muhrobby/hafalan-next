'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      // Redirect to login page if not authenticated
      router.push('/auth/signin')
      return
    }

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

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat...</p>
      </div>
    </div>
  )
}