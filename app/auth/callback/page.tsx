import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) => cookies().set(name, value, options));
          } catch {
            // ignore
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user in session, redirect to login
    redirect("/auth/login");
  }

  // Ensure a profile exists in users table
  try {
    const { data: profileData, error: upsertError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata as any)?.full_name || null,
      role: (user.user_metadata as any)?.role || null,
      phone: (user.user_metadata as any)?.phone || null,
      company: (user.user_metadata as any)?.company || null,
    });

    if (upsertError) {
      // Log and surface by redirecting to an error page or showing message — use console for now
      console.error("Failed to upsert profile on callback:", upsertError);
      // Optional: redirect to an error page with query param (not implemented)
    }
  } catch (err) {
    console.error("Unexpected error when upserting profile on callback:", err);
  }

  // Redirect to /dashboard — middleware will route to role-specific dashboard
  redirect("/dashboard");
}
