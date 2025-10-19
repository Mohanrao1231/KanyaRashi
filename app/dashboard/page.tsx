import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  // Try to use the service role key when available; fall back to anon key to avoid crashes in dev
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey!, {
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
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Try to load profile from users table
  let profile: any = null;
  try {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    profile = data;
  } catch (err) {
    // ignore — we'll fallback to metadata
    console.warn("Unable to fetch profile in dashboard root:", err);
  }

  const roleFromProfile = profile?.role;
  const roleFromMetadata = (user.user_metadata as any)?.role;

  const role = roleFromProfile || roleFromMetadata || null;

  if (!role) {
    // No role available — send user to settings to complete profile
    redirect("/settings");
  }

  // Normalize known roles to the existing dashboard paths
  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "courier":
      redirect("/dashboard/courier");
    case "recipient":
      redirect("/dashboard/recipient");
    case "sender":
    default:
      redirect("/dashboard/sender");
  }
}
