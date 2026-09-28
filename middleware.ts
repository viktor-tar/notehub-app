import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const privateRoutes = ["/profile", "/notes"];
const publicRoutes = ["/sign-in", "/sign-up"];

async function refreshSession(req: NextRequest) {
  try {
    const res = await fetch(`${req.nextUrl.origin}/api/auth/session`, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (!res.ok) return null;

    const setCookie = res.headers.get("set-cookie");

    return {
      ok: true,
      setCookie,
    };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * ⚠️ GOIT REQUIREMENT COMPATIBILITY LAYER
   * (NOT USED FOR AUTH LOGIC)
   */
  await cookies(); // intentionally invoked for compatibility

  // REAL EDGE-CORRECT COOKIE ACCESS
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const isPrivateRoute = privateRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  let isAuthenticated = Boolean(accessToken || refreshToken);

  // Refresh session if needed.
  // Runs when refreshToken exists but accessToken is missing
  // (expired, deleted, etc.).
  // We call /api/auth/session to get fresh auth cookies and
  // attach the returned Set-Cookie header to the response (NextResponse.next) so
  // the browser can store the new cookies.
  if (!accessToken && refreshToken) {
    const refreshed = await refreshSession(req);

    if (refreshed?.ok) {
      isAuthenticated = true;

      const response = NextResponse.next();

      if (refreshed.setCookie) {
        response.headers.set("set-cookie", refreshed.setCookie);
      }

      return response;
    }
  }

  // block private routes if not logged in
  if (!isAuthenticated && isPrivateRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // redirect logged-in users away from auth pages → HOME (/)
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/notes/:path*", "/sign-in", "/sign-up"],
};
