import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { tracking: string } }) {
  try {
    const supabase = await createClient()

    const { data: package_data, error } = await supabase
      .from("packages")
      .select(`
        id,
        tracking_number,
        title,
        status,
        created_at,
        pickup_date,
        expected_delivery,
        actual_delivery,
        pickup_address,
        delivery_address,
        custody_transfers(
          id,
          transfer_type,
          location_address,
          timestamp,
          verified,
          to_user:to_user_id(full_name)
        )
      `)
      .eq("tracking_number", params.tracking.toUpperCase())
      .single()

    if (error) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Public tracking - only return essential information
    const publicData = {
      tracking_number: package_data.tracking_number,
      title: package_data.title,
      status: package_data.status,
      created_at: package_data.created_at,
      pickup_date: package_data.pickup_date,
      expected_delivery: package_data.expected_delivery,
      actual_delivery: package_data.actual_delivery,
      pickup_address: package_data.pickup_address,
      delivery_address: package_data.delivery_address,
      custody_chain: package_data.custody_transfers.map((transfer: any) => ({
        type: transfer.transfer_type,
        location: transfer.location_address,
        timestamp: transfer.timestamp,
        verified: transfer.verified,
        custodian: transfer.to_user?.full_name || "Unknown",
      })),
    }

    return NextResponse.json({ package: publicData })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
