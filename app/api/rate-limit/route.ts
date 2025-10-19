import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // requests per window
}

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()

  // Clean up expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(ip)

  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })

    return NextResponse.json({
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
  }

  if (current.count >= RATE_LIMIT.maxRequests) {
    return NextResponse.json(
      {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: current.resetTime - now,
      },
      { status: 429 },
    )
  }

  // Increment count
  current.count++
  rateLimitMap.set(ip, current)

  return NextResponse.json({
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - current.count,
    resetTime: current.resetTime,
  })
}
