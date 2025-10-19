"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PhotoUploadProps {
  packageId: string
  onPhotoUploaded: (photoUrl: string, photoId: string) => void
  required?: boolean
  title?: string
}

export function PhotoUpload({
  packageId,
  onPhotoUploaded,
  required = false,
  title = "Upload Photo",
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError("Camera access denied or not available")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await uploadPhoto(blob)
            stopCamera()
          }
        },
        "image/jpeg",
        0.8,
      )
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadPhoto(file)
    }
  }

  const uploadPhoto = async (file: Blob) => {
    setIsUploading(true)
    setError(null)

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `package-${packageId}-${timestamp}.jpg`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("package-photos")
        .upload(filename, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("package-photos").getPublicUrl(filename)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Save photo record to database
      const { data: photoData, error: dbError } = await supabase
        .from("package_photos")
        .insert({
          package_id: packageId,
          photo_url: publicUrl,
          uploaded_by: user.id,
          metadata: {
            filename,
            size: file.size,
            type: file.type,
          },
        })
        .select()
        .single()

      if (dbError) throw dbError

      onPhotoUploaded(publicUrl, photoData.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {preview && (
          <div className="relative">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isCameraActive && (
          <div className="space-y-4">
            <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-lg bg-gray-900" />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} disabled={isUploading}>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isCameraActive && !preview && (
          <div className="flex gap-2">
            <Button onClick={startCamera} disabled={isUploading}>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <canvas ref={canvasRef} className="hidden" />

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Uploading photo...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
