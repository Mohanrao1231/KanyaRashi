import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Pricing calculator for Indian market
const PRICING_CONFIG = {
  baseRate: 50, // Base rate in INR
  weightMultiplier: 10, // INR per kg
  distanceMultiplier: 2, // INR per km
  priorityMultipliers: {
    standard: 1,
    express: 1.5,
    overnight: 2.5,
  },
  fragileMultiplier: 1.2,
  insuranceRate: 0.02, // 2% of declared value
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookies().set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      weight,
      priority = "standard",
      fragile = false,
      declaredValue = 0,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    } = body

    // Calculate distance if coordinates provided
    let distance = 10 // Default 10km if no coordinates
    if (pickupLat && pickupLng && deliveryLat && deliveryLng) {
      distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
    }

    // Calculate pricing
    let totalCost = PRICING_CONFIG.baseRate
    totalCost += weight * PRICING_CONFIG.weightMultiplier
    totalCost += distance * PRICING_CONFIG.distanceMultiplier
    totalCost *= PRICING_CONFIG.priorityMultipliers[priority as keyof typeof PRICING_CONFIG.priorityMultipliers] || 1

    if (fragile) {
      totalCost *= PRICING_CONFIG.fragileMultiplier
    }

    const insuranceCost = declaredValue * PRICING_CONFIG.insuranceRate
    const finalCost = Math.round(totalCost + insuranceCost)

    return NextResponse.json({
      pricing: {
        baseCost: Math.round(PRICING_CONFIG.baseRate),
        weightCost: Math.round(weight * PRICING_CONFIG.weightMultiplier),
        distanceCost: Math.round(distance * PRICING_CONFIG.distanceMultiplier),
        priorityCost: Math.round(
          totalCost -
            PRICING_CONFIG.baseRate -
            weight * PRICING_CONFIG.weightMultiplier -
            distance * PRICING_CONFIG.distanceMultiplier,
        ),
        fragileCost: fragile ? Math.round(totalCost * (PRICING_CONFIG.fragileMultiplier - 1)) : 0,
        insuranceCost: Math.round(insuranceCost),
        totalCost: finalCost,
        currency: "INR",
        distance: Math.round(distance * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Pricing calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 })
  }
}
