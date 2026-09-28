// middleware.ts
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  await cookies();

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  const isPrivateRoute = privateRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  let isAuthenticated = Boolean(accessToken || refreshToken);

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

  if (!isAuthenticated && isPrivateRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Added default export to satisfy Turbopack checks
export default middleware;

export const config = {
  matcher: ["/profile/:path*", "/notes/:path*", "/sign-in", "/sign-up"],
};
