import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySessionToken } from "./session";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

export async function getCurrentUser(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const userId = Number(session?.sub);

  if (!Number.isInteger(userId) || userId <= 0) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
  } catch (error) {
    console.error("Unable to load current user:", error);
    return null;
  }
}

export async function requireUser(request) {
  return getCurrentUser(request);
}

export async function requireAdmin(request) {
  const user = await getCurrentUser(request);
  return user?.role === "ADMIN" ? user : null;
}
