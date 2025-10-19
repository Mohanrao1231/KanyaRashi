import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Handle session
  const response = await updateSession(request);

  // Correct cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Role-based redirect
  if (user && request.nextUrl.pathname === "/dashboard") {
    const role = user.user_metadata?.role;

    if (role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }
    if (role === "courier") {
      return NextResponse.redirect(new URL("/dashboard/courier", request.url));
    }
    if (role === "recipient") {
      return NextResponse.redirect(new URL("/dashboard/recipient", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
