import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get package statistics
    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("status, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)

    if (packagesError) {
      console.error("Packages query error:", packagesError)
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    // Calculate statistics
    const totalPackages = packages.length
    const deliveredPackages = packages.filter((p) => p.status === "delivered").length
    const inTransitPackages = packages.filter((p) => p.status === "in_transit" || p.status === "picked_up").length
    const pendingPackages = packages.filter((p) => p.status === "created").length

    // Get recent activity
    const { data: recentTransfers, error: transfersError } = await supabase
      .from("custody_transfers")
      .select(`
        *,
        package:package_id(tracking_number, title),
        from_user:from_user_id(full_name),
        to_user:to_user_id(full_name)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("timestamp", { ascending: false })
      .limit(10)

    if (transfersError) {
      console.error("Transfers query error:", transfersError)
    }

    // Calculate delivery performance (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPackages = packages.filter((p) => new Date(p.created_at) >= thirtyDaysAgo)

    const analytics = {
      totalPackages,
      deliveredPackages,
      inTransitPackages,
      pendingPackages,
      deliveryRate: totalPackages > 0 ? Math.round((deliveredPackages / totalPackages) * 100) : 0,
      recentActivity: recentTransfers || [],
      monthlyStats: {
        total: recentPackages.length,
        delivered: recentPackages.filter((p) => p.status === "delivered").length,
        inTransit: recentPackages.filter((p) => p.status === "in_transit" || p.status === "picked_up").length,
        pending: recentPackages.filter((p) => p.status === "created").length,
      },
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
