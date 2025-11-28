import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class PasswordChangeRequiredError extends Error {
  constructor(message = "Password change required") {
    super(message);
    this.name = "PasswordChangeRequiredError";
  }
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Require session and verify user doesn't need password change
 * This does a database check to ensure JWT isn't stale
 */
export async function requireActiveSession() {
  const session = await requireSession();

  // Double-check from database to prevent JWT bypass
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  if (user?.mustChangePassword) {
    throw new PasswordChangeRequiredError();
  }

  return session;
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const session = await requireSession();
  if (!session.user?.role || !allowed.includes(session.user.role as UserRole)) {
    throw new ForbiddenError();
  }
  return session;
}

/**
 * Require role with active session check (no password change required)
 */
export async function requireActiveRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const session = await requireActiveSession();
  if (!session.user?.role || !allowed.includes(session.user.role as UserRole)) {
    throw new ForbiddenError();
  }
  return session;
}
