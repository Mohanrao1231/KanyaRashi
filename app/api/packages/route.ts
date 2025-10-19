import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const role = searchParams.get("role")

    let query = supabase.from("packages").select(`
        *,
        sender:sender_id(id, full_name, email),
        recipient:recipient_id(id, full_name, email)
      `)

    // Filter based on user role and involvement
    if (role === "sender") {
      query = query.eq("sender_id", user.id)
    } else if (role === "recipient") {
      query = query.eq("recipient_id", user.id)
    } else {
      // Show packages user is involved with
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    query = query.order("created_at", { ascending: false })

    const { data: packages, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
    }

    return NextResponse.json({ packages })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      recipient_email,
      title,
      description,
      weight,
      dimensions,
      value,
      fragile,
      priority,
      pickup_address,
      delivery_address,
      pickup_date,
      expected_delivery,
    } = body

    // Find recipient by email
    const { data: recipient, error: recipientError } = await supabase
      .from("users")
      .select("id")
      .eq("email", recipient_email)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Create package
    const { data: package_data, error: packageError } = await supabase
      .from("packages")
      .insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        title,
        description,
        weight: Number.parseFloat(weight),
        dimensions: JSON.stringify(dimensions),
        value: Number.parseFloat(value),
        fragile: Boolean(fragile),
        priority: priority || "standard",
        pickup_address,
        delivery_address,
        pickup_date,
        expected_delivery,
        status: "created",
      })
      .select()
      .single()

    if (packageError) {
      console.error("Package creation error:", packageError)
      return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
    }

    // Create notification for recipient
    await supabase.from("notifications").insert({
      user_id: recipient.id,
      package_id: package_data.id,
      title: "New Package Created",
      message: `A new package "${title}" has been created for you by ${user.email}`,
      type: "info",
    })

    return NextResponse.json({ package: package_data }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
