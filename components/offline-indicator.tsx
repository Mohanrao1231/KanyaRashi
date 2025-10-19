"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showOfflineMessage) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert
        className={`border-2 ${isOnline ? "border-green-500 bg-green-500/10" : "border-orange-500 bg-orange-500/10"}`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-orange-500" />}
          <AlertDescription className={isOnline ? "text-green-400" : "text-orange-400"}>
            {isOnline ? "Connection restored" : "You are offline. Some features may not work."}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
