"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Globe, Hash, Clock, FileText, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface IPFSFile {
  hash: string
  name: string
  size: number
  type: string
  uploadedAt: string
  url: string
}

export function IPFSStorage() {
  const [files, setFiles] = useState<IPFSFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Validate file size (max 10MB for demo)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB")
    }

    // Validate file type
    const allowedTypes = ["image/", "application/pdf", "text/", "application/json"]
    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      throw new Error("File type not supported")
    }

    // Simulate upload delay with progress
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    // Generate more realistic IPFS hash
    const hashChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let hash = "Qm"
    for (let i = 0; i < 44; i++) {
      hash += hashChars.charAt(Math.floor(Math.random() * hashChars.length))
    }

    return hash
  }

  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        try {
          const hash = await uploadToIPFS(file)

          const ipfsFile: IPFSFile = {
            hash,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            url: `https://ipfs.io/ipfs/${hash}`,
          }

          return ipfsFile
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          toast({
            title: `Failed to upload ${file.name}`,
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          })
          return null
        }
      })

      const uploadResults = await Promise.all(uploadPromises)
      const successfulUploads = uploadResults.filter((file): file is IPFSFile => file !== null)

      if (successfulUploads.length > 0) {
        setFiles((prev) => [...successfulUploads, ...prev])
        toast({
          title: "Files uploaded successfully",
          description: `${successfulUploads.length} file(s) uploaded to IPFS`,
        })
      }
    } catch (error) {
      console.error("Error uploading to IPFS:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files to IPFS",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "IPFS hash copied to clipboard",
    })
  }

  const removeFile = (hash: string) => {
    setFiles((prev) => prev.filter((file) => file.hash !== hash))
    toast({
      title: "File removed",
      description: "File removed from local list",
    })
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            IPFS Decentralized Storage
          </CardTitle>
          <CardDescription>
            Upload files to the InterPlanetary File System for permanent, decentralized storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Upload Guidelines:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Maximum file size: 10MB</li>
                  <li>Supported types: Images, PDFs, Text files, JSON</li>
                  <li>Files are stored permanently on IPFS network</li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload to IPFS</h3>
            <p className="text-muted-foreground mb-4">Drag and drop files here, or click to select files</p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              accept="image/*,.pdf,.txt,.json"
            />
            <label htmlFor="file-upload">
              <Button disabled={uploading} className="cursor-pointer">
                {uploading ? "Uploading..." : "Select Files"}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
            <CardDescription>Files stored on IPFS network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.hash} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {file.hash.substring(0, 12)}...
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      IPFS
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(file.hash)}>
                      Copy Hash
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(file.url, "_blank")}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => removeFile(file.hash)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
