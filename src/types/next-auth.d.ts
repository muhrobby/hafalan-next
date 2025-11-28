import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mustChangePassword?: boolean;
      teacherProfile?: any;
      waliProfile?: any;
      santriProfile?: any;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    mustChangePassword?: boolean;
    teacherProfile?: any;
    waliProfile?: any;
    santriProfile?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    mustChangePassword?: boolean;
    teacherProfile?: any;
    waliProfile?: any;
    santriProfile?: any;
  }
}
