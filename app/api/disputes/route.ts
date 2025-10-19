import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const priority = searchParams.get("priority")

    let query = supabase
      .from("disputes")
      .select(`
        *,
        packages(tracking_number, title, description),
        users(full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }
    if (type) {
      query = query.eq("type", type)
    }
    if (priority) {
      query = query.eq("priority", priority)
    }

    const { data: disputes, error } = await query

    if (error) {
      console.error("Error fetching disputes:", error)
      return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 })
    }

    return NextResponse.json({ disputes })
  } catch (error) {
    console.error("Error in disputes GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { package_id, tracking_number, type, priority, title, description, evidence_photos } = body

    if (!package_id || !tracking_number || !type || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has access to this package
    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("*")
      .eq("id", package_id)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Check if user is involved with this package
    const { data: transfers } = await supabase
      .from("custody_transfers")
      .select("*")
      .eq("package_id", package_id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

    const isInvolved =
      packageData.sender_id === user.id || packageData.recipient_id === user.id || transfers?.length > 0

    if (!isInvolved) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: dispute, error } = await supabase
      .from("disputes")
      .insert({
        package_id,
        user_id: user.id,
        tracking_number,
        type,
        priority: priority || "medium",
        title,
        description,
        evidence_photos: evidence_photos || [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating dispute:", error)
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 })
    }

    // Create notification for admins
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin")

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        package_id,
        title: "New Dispute Created",
        message: `A new ${type} dispute has been created for package ${tracking_number}`,
        type: "warning" as const,
      }))

      await supabase.from("notifications").insert(notifications)
    }

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (error) {
    console.error("Error in disputes POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
