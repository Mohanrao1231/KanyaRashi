"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Camera, CheckCircle, XCircle, AlertTriangle, Zap, Brain, ImageIcon, Scan } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface VerificationResult {
  similarity: number
  confidence: number
  status: "verified" | "failed" | "warning"
  details: string[]
  damageDetected: boolean
  authenticity: number
}

export function AIVerification() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [comparisonImage, setComparisonImage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  // Mock AI verification function - replace with actual AI service
  const performAIVerification = async (original: string, comparison: string): Promise<VerificationResult> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Generate mock verification results
    const similarity = Math.random() * 100
    const confidence = Math.random() * 100
    const authenticity = Math.random() * 100
    const damageDetected = Math.random() > 0.7

    let status: "verified" | "failed" | "warning" = "verified"
    const details: string[] = []

    if (similarity < 70) {
      status = "failed"
      details.push("Low similarity score detected")
      details.push("Package appearance significantly different")
    } else if (similarity < 85) {
      status = "warning"
      details.push("Moderate similarity score")
      details.push("Minor differences detected")
    } else {
      details.push("High similarity score")
      details.push("Package appearance matches original")
    }

    if (damageDetected) {
      status = status === "verified" ? "warning" : status
      details.push("Potential damage detected")
      details.push("Visual inspection recommended")
    } else {
      details.push("No visible damage detected")
    }

    if (authenticity > 80) {
      details.push("High authenticity confidence")
    } else {
      details.push("Moderate authenticity confidence")
    }

    return {
      similarity,
      confidence,
      status,
      details,
      damageDetected,
      authenticity,
    }
  }

  const handleImageUpload = (file: File, type: "original" | "comparison") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (type === "original") {
        setOriginalImage(result)
      } else {
        setComparisonImage(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const startVerification = async () => {
    if (!originalImage || !comparisonImage) {
      toast({
        title: "Missing images",
        description: "Please upload both original and comparison images",
        variant: "destructive",
      })
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      const verificationResult = await performAIVerification(originalImage, comparisonImage)
      setResult(verificationResult)

      toast({
        title: "Verification complete",
        description: `Package ${verificationResult.status === "verified" ? "verified" : "requires attention"}`,
        variant: verificationResult.status === "failed" ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Error during AI verification:", error)
      toast({
        title: "Verification failed",
        description: "Failed to process images",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-chart-5" />
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-chart-3" />
      default:
        return <Eye className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-chart-5"
      case "failed":
        return "text-destructive"
      case "warning":
        return "text-chart-3"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Package Verification
          </CardTitle>
          <CardDescription>
            Upload package photos for AI-powered similarity analysis and damage detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Image Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Original Package Photo
              </h3>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {originalImage ? (
                  <div className="space-y-3">
                    <img
                      src={originalImage || "/placeholder.svg"}
                      alt="Original package"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button variant="outline" size="sm" onClick={() => setOriginalImage(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Upload original package photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "original")}
                      className="hidden"
                      id="original-upload"
                    />
                    <label htmlFor="original-upload">
                      <Button className="cursor-pointer">Select Image</Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Image Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Scan className="w-4 h-4" />
                Current Package Photo
              </h3>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {comparisonImage ? (
                  <div className="space-y-3">
                    <img
                      src={comparisonImage || "/placeholder.svg"}
                      alt="Current package"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button variant="outline" size="sm" onClick={() => setComparisonImage(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Upload current package photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "comparison")}
                      className="hidden"
                      id="comparison-upload"
                    />
                    <label htmlFor="comparison-upload">
                      <Button className="cursor-pointer">Select Image</Button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={startVerification}
              disabled={!originalImage || !comparisonImage || verifying}
              className="gradient-primary"
            >
              {verifying ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Images...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Start AI Verification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {result && (
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              Verification Results
            </CardTitle>
            <CardDescription>
              AI analysis complete - {result.status === "verified" ? "Package verified" : "Attention required"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <Badge
                  variant={
                    result.status === "verified" ? "default" : result.status === "failed" ? "destructive" : "secondary"
                  }
                  className="text-lg px-4 py-2"
                >
                  {result.status.toUpperCase()}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Similarity Score</p>
                  <div className="space-y-2">
                    <p className={`text-2xl font-bold ${getStatusColor(result.status)}`}>
                      {result.similarity.toFixed(1)}%
                    </p>
                    <Progress value={result.similarity} className="h-2" />
                  </div>
                </div>

                <div className="text-center p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">{result.confidence.toFixed(1)}%</p>
                    <Progress value={result.confidence} className="h-2" />
                  </div>
                </div>

                <div className="text-center p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Authenticity</p>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-chart-2">{result.authenticity.toFixed(1)}%</p>
                    <Progress value={result.authenticity} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="space-y-3">
                <h4 className="font-semibold">Analysis Details</h4>
                <div className="space-y-2">
                  {result.details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Damage Detection */}
              {result.damageDetected && (
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="font-semibold text-destructive">Damage Detected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The AI has detected potential damage to the package. Manual inspection is recommended.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
