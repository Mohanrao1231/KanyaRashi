"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"

interface RateLimiterProps {
  maxRequests: number
  windowMs: number
  onRateLimit?: () => void
}

export function useRateLimit({ maxRequests, windowMs, onRateLimit }: RateLimiterProps) {
  const [requests, setRequests] = useState<number[]>([])
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [resetTime, setResetTime] = useState<number | null>(null)

  const checkRateLimit = () => {
    const now = Date.now()
    const windowStart = now - windowMs

    // Filter out old requests
    const recentRequests = requests.filter((time) => time > windowStart)

    if (recentRequests.length >= maxRequests) {
      setIsRateLimited(true)
      setResetTime(recentRequests[0] + windowMs)
      onRateLimit?.()
      return false
    }

    // Add current request
    setRequests([...recentRequests, now])
    return true
  }

  useEffect(() => {
    if (isRateLimited && resetTime) {
      const timer = setTimeout(() => {
        if (Date.now() >= resetTime) {
          setIsRateLimited(false)
          setResetTime(null)
          setRequests([])
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isRateLimited, resetTime])

  const remainingTime = resetTime ? Math.max(0, resetTime - Date.now()) : 0
  const progress = resetTime ? ((windowMs - remainingTime) / windowMs) * 100 : 0

  return {
    canMakeRequest: checkRateLimit,
    isRateLimited,
    remainingTime,
    progress,
    requestsRemaining: Math.max(0, maxRequests - requests.length),
  }
}

export function RateLimitIndicator({
  isRateLimited,
  remainingTime,
  progress,
}: {
  isRateLimited: boolean
  remainingTime: number
  progress: number
}) {
  if (!isRateLimited) return null

  const minutes = Math.floor(remainingTime / 60000)
  const seconds = Math.floor((remainingTime % 60000) / 1000)

  return (
    <Alert className="border-orange-500 bg-orange-500/10">
      <Clock className="w-4 h-4 text-orange-500" />
      <AlertDescription className="text-orange-400">
        <div className="space-y-2">
          <p>Rate limit exceeded. Please wait before making more requests.</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>
                Reset in: {minutes}m {seconds}s
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
