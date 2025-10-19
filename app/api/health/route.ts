import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check database connection
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      throw error
    }

    // Check environment variables
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: missingEnvVars.length === 0 ? "configured" : "missing_vars",
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
      version: process.env.npm_package_version || "1.0.0",
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
