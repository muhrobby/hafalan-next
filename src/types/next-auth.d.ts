import { DefaultSession } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      teacherProfile?: any
      waliProfile?: any
      santriProfile?: any
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    teacherProfile?: any
    waliProfile?: any
    santriProfile?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    teacherProfile?: any
    waliProfile?: any
    santriProfile?: any
  }
}