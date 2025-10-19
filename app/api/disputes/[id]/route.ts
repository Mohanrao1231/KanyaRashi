import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: dispute, error } = await supabase
      .from("disputes")
      .select(`
        *,
        packages(tracking_number, title, description, sender_id, recipient_id),
        users(full_name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    return NextResponse.json({ dispute })
  } catch (error) {
    console.error("Error in dispute GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { status, resolution, assigned_to, priority } = body

    // Check if user is admin or dispute creator
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    const { data: dispute } = await supabase.from("disputes").select("user_id").eq("id", params.id).single()

    const canUpdate = userProfile?.role === "admin" || dispute?.user_id === user.id

    if (!canUpdate) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }

    if (status) updateData.status = status
    if (resolution) updateData.resolution = resolution
    if (assigned_to) updateData.assigned_to = assigned_to
    if (priority) updateData.priority = priority

    const { data: updatedDispute, error } = await supabase
      .from("disputes")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating dispute:", error)
      return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 })
    }

    return NextResponse.json({ dispute: updatedDispute })
  } catch (error) {
    console.error("Error in dispute PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
