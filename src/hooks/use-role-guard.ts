"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

type UserRole = "ADMIN" | "TEACHER" | "SANTRI" | "WALI";

interface UseRoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Client-side role guard hook.
 * This is a secondary security layer - primary protection is in middleware.
 * Use this for additional client-side role validation.
 *
 * @param optionsOrRoles - Either an options object or an array of allowed roles
 * @param redirectTo - Optional redirect path (only used when first param is array)
 */
export function useRoleGuard(
  optionsOrRoles: UseRoleGuardOptions | UserRole[],
  redirectTo: string = "/unauthorized"
) {
  // Support both formats: useRoleGuard(["ADMIN"]) and useRoleGuard({ allowedRoles: ["ADMIN"] })
  const options: UseRoleGuardOptions = Array.isArray(optionsOrRoles)
    ? { allowedRoles: optionsOrRoles, redirectTo }
    : optionsOrRoles;

  const { allowedRoles, redirectTo: redirect = "/unauthorized" } = options;

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const userRole = session.user?.role as UserRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(
        `[RoleGuard] Unauthorized access attempt to ${pathname} by role: ${userRole}`
      );
      router.push(redirect);
    }
  }, [session, status, allowedRoles, redirect, router, pathname]);

  const isAuthorized =
    session?.user?.role && allowedRoles.includes(session.user.role as UserRole);
  const isLoading = status === "loading";

  return {
    session,
    isAuthorized,
    isLoading,
    userRole: session?.user?.role as UserRole | undefined,
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(session: any, roles: UserRole | UserRole[]): boolean {
  if (!session?.user?.role) return false;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(session.user.role as UserRole);
}

/**
 * Get role-based redirect path
 */
export function getRoleBasedPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "SANTRI":
      return "/santri";
    case "WALI":
      return "/wali";
    default:
      return "/";
  }
}
