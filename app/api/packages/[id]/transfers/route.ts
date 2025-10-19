import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: transfers, error } = await supabase
      .from("custody_transfers")
      .select(`
        *,
        from_user:from_user_id(id, full_name, email),
        to_user:to_user_id(id, full_name, email)
      `)
      .eq("package_id", params.id)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
    }

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      to_user_email,
      transfer_type,
      location_lat,
      location_lng,
      location_address,
      photo_hash,
      signature_hash,
      notes,
    } = body

    // Find the recipient user
    const { data: to_user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", to_user_email)
      .single()

    if (userError || !to_user) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 })
    }

    // Create custody transfer
    const { data: transfer, error: transferError } = await supabase
      .from("custody_transfers")
      .insert({
        package_id: params.id,
        from_user_id: user.id,
        to_user_id: to_user.id,
        transfer_type,
        location_lat: location_lat ? Number.parseFloat(location_lat) : null,
        location_lng: location_lng ? Number.parseFloat(location_lng) : null,
        location_address,
        photo_hash,
        signature_hash,
        notes,
        verified: false,
      })
      .select()
      .single()

    if (transferError) {
      console.error("Transfer creation error:", transferError)
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
    }

    // Update package status based on transfer type
    let newStatus = "in_transit"
    if (transfer_type === "pickup") newStatus = "picked_up"
    else if (transfer_type === "delivery") newStatus = "delivered"

    await supabase.from("packages").update({ status: newStatus }).eq("id", params.id)

    // Create notification for recipient
    await supabase.from("notifications").insert({
      user_id: to_user.id,
      package_id: params.id,
      title: "Custody Transfer",
      message: `Package custody has been transferred to you by ${user.email}`,
      type: "info",
    })

    return NextResponse.json({ transfer }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
