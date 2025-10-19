"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Zap, Clock, Wifi } from "lucide-react"

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  connectionType: string
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      const memory = (performance as any).memory
      const connection = (navigator as any).connection

      setMetrics({
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
        connectionType: connection ? connection.effectiveType : "unknown",
      })
    }

    // Measure after page load
    if (document.readyState === "complete") {
      measurePerformance()
    } else {
      window.addEventListener("load", measurePerformance)
    }

    // Toggle visibility with Ctrl+Shift+P
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => {
      window.removeEventListener("load", measurePerformance)
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [isVisible])

  if (!metrics || !isVisible) return null

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return "text-green-400"
    if (value < thresholds[1]) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              DEV
            </Badge>
          </div>
          <CardDescription className="text-xs">Press Ctrl+Shift+P to toggle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Load Time
              </div>
              <span className={getPerformanceColor(metrics.loadTime, [1000, 3000])}>
                {metrics.loadTime.toFixed(0)}ms
              </span>
            </div>
            <Progress value={Math.min((metrics.loadTime / 5000) * 100, 100)} className="h-1" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Render Time
              </div>
              <span className={getPerformanceColor(metrics.renderTime, [500, 1500])}>
                {metrics.renderTime.toFixed(0)}ms
              </span>
            </div>
            <Progress value={Math.min((metrics.renderTime / 3000) * 100, 100)} className="h-1" />
          </div>

          {metrics.memoryUsage > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Memory
                </div>
                <span className={getPerformanceColor(metrics.memoryUsage, [50, 100])}>
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
              <Progress value={Math.min((metrics.memoryUsage / 200) * 100, 100)} className="h-1" />
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Connection
            </div>
            <Badge variant="outline" className="text-xs">
              {metrics.connectionType}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
