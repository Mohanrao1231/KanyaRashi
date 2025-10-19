"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, AlertCircle, RefreshCw } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

interface GeolocationTrackerProps {
  onLocationUpdate: (location: LocationData) => void
  autoTrack?: boolean
  showMap?: boolean
}

export function GeolocationTracker({ onLocationUpdate, autoTrack = false, showMap = true }: GeolocationTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string>("")
  const [watchId, setWatchId] = useState<number | null>(null)

  useEffect(() => {
    if (autoTrack) {
      startTracking()
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [autoTrack])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setError("")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }

        // Get address from coordinates
        try {
          const address = await reverseGeocode(locationData.latitude, locationData.longitude)
          locationData.address = address
        } catch (err) {
          console.warn("Failed to get address:", err)
        }

        setLocation(locationData)
        onLocationUpdate(locationData)
      },
      (error) => {
        let errorMessage = "Failed to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsTracking(true)
    setError("")

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }

        try {
          const address = await reverseGeocode(locationData.latitude, locationData.longitude)
          locationData.address = address
        } catch (err) {
          console.warn("Failed to get address:", err)
        }

        setLocation(locationData)
        onLocationUpdate(locationData)
      },
      (error) => {
        let errorMessage = "Failed to track location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setError(errorMessage)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    )

    setWatchId(id)
  }

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Using OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    )

    if (!response.ok) {
      throw new Error("Failed to get address")
    }

    const data = await response.json()
    return data.display_name || "Address not found"
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "bg-green-500"
    if (accuracy <= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracker
          {isTracking && (
            <Badge variant="default" className="ml-auto">
              <Navigation className="h-3 w-3 mr-1" />
              Tracking
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {location && (
          <div className="space-y-3">
            <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Coordinates:</span>
                <code className="text-sm font-mono">{formatCoordinates(location.latitude, location.longitude)}</code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Accuracy:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getAccuracyColor(location.accuracy)}`}></div>
                  <span className="text-sm">±{location.accuracy.toFixed(0)}m</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Updated:</span>
                <span className="text-sm">{new Date(location.timestamp).toLocaleTimeString()}</span>
              </div>

              {location.address && (
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-sm text-gray-400">Address:</span>
                  <p className="text-sm mt-1">{location.address}</p>
                </div>
              )}
            </div>

            {showMap && (
              <div className="h-48 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  title="Location Map"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={getCurrentLocation} variant="outline" size="sm" disabled={isTracking}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Get Location
          </Button>

          {!isTracking ? (
            <Button onClick={startTracking} size="sm">
              <Navigation className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="destructive" size="sm">
              Stop Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
