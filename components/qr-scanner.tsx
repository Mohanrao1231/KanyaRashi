"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Square, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setError("")
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        // Start scanning for QR codes
        scanForQRCode()
      }
    } catch (err) {
      const errorMsg = "Camera access denied or not available"
      setError(errorMsg)
      onError?.(errorMsg)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const scanForQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)

      if (imageData) {
        // Simple QR code detection (in a real app, you'd use a library like jsQR)
        // For now, we'll simulate detection
        detectQRCode(imageData)
      }
    }

    // Continue scanning
    if (isScanning) {
      requestAnimationFrame(scanForQRCode)
    }
  }

  const detectQRCode = (imageData: ImageData) => {
    // This is a simplified QR detection
    // In a real implementation, you would use a library like jsQR
    // For demo purposes, we'll simulate detection after a few seconds

    // Simulate QR code detection
    setTimeout(() => {
      if (isScanning && Math.random() > 0.95) {
        // 5% chance per frame
        const mockQRData = `TL${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        onScan(mockQRData)
        stopScanning()
      }
    }, 100)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {isScanning ? (
          <div className="space-y-4">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-lg bg-gray-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-400 rounded-lg">
                  <Square className="w-full h-full text-blue-400/30" />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  Position QR code within the frame
                </div>
              </div>
            </div>

            <Button onClick={stopScanning} variant="outline" className="w-full bg-transparent">
              Stop Scanning
            </Button>
          </div>
        ) : (
          <Button onClick={startScanning} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Start Scanning
          </Button>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
