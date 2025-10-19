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

    const { data: package_data, error } = await supabase
      .from("packages")
      .select(`
        *,
        sender:sender_id(id, full_name, email, wallet_address),
        recipient:recipient_id(id, full_name, email, wallet_address),
        custody_transfers(*),
        package_photos(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Check if user has access to this package
    const hasAccess =
      package_data.sender_id === user.id ||
      package_data.recipient_id === user.id ||
      package_data.custody_transfers.some(
        (transfer: any) => transfer.from_user_id === user.id || transfer.to_user_id === user.id,
      )

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ package: package_data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { status, blockchain_hash, ipfs_hash, actual_delivery } = body

    // Verify user has access to update this package
    const { data: package_data, error: fetchError } = await supabase
      .from("packages")
      .select("sender_id, recipient_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !package_data) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    const hasAccess = package_data.sender_id === user.id || package_data.recipient_id === user.id

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (blockchain_hash) updateData.blockchain_hash = blockchain_hash
    if (ipfs_hash) updateData.ipfs_hash = ipfs_hash
    if (actual_delivery) updateData.actual_delivery = actual_delivery

    const { data: updated_package, error: updateError } = await supabase
      .from("packages")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Package update error:", updateError)
      return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
    }

    return NextResponse.json({ package: updated_package })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
