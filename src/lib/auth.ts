import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            teacherProfile: true,
            waliProfile: true,
            santriProfile: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // CRITICAL: Check if user is active based on role
        // Admin tidak memiliki profile, jadi selalu aktif
        if (user.role === "TEACHER" && user.teacherProfile && !user.teacherProfile.isActive) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi administrator.");
        }
        if (user.role === "WALI" && user.waliProfile && !user.waliProfile.isActive) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi administrator.");
        }
        if (user.role === "SANTRI" && user.santriProfile && !user.santriProfile.isActive) {
          throw new Error("Akun Anda tidak aktif. Silakan hubungi administrator.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teacherProfile: user.teacherProfile,
          waliProfile: user.waliProfile,
          santriProfile: user.santriProfile,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update token every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.teacherProfile = user.teacherProfile;
        token.waliProfile = user.waliProfile;
        token.santriProfile = user.santriProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.teacherProfile = token.teacherProfile as any;
        session.user.waliProfile = token.waliProfile as any;
        session.user.santriProfile = token.santriProfile as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
