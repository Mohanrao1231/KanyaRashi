"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Download, Share } from "lucide-react"

interface QRCodeGeneratorProps {
  data: string
  title?: string
  size?: number
}

export function QRCodeGenerator({ data, title = "QR Code", size = 200 }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    generateQRCode()
  }, [data])

  const generateQRCode = async () => {
    setIsLoading(true)
    try {
      // Using QR Server API for QR code generation
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&bgcolor=1a1a1a&color=ffffff&margin=10`
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-code-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading QR code:", error)
    }
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        const file = new File([blob], "qr-code.png", { type: "image/png" })

        await navigator.share({
          title: title,
          text: `QR Code for: ${data}`,
          files: [file],
        })
      } catch (error) {
        console.error("Error sharing QR code:", error)
        // Fallback to copying URL
        navigator.clipboard.writeText(data)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(data)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center w-48 h-48 bg-gray-800/50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <img
              src={qrCodeUrl || "/placeholder.svg"}
              alt="QR Code"
              className="rounded-lg border border-gray-700"
              width={size}
              height={size}
            />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 break-all font-mono bg-gray-800/50 p-2 rounded">{data}</p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={downloadQRCode} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={shareQRCode} disabled={isLoading}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
