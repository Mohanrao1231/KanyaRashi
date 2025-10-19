import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { OfflineIndicator } from "@/components/offline-indicator"
import { PerformanceMonitor } from "@/components/performance-monitor"
import "./globals.css"

export const metadata: Metadata = {
  title: "Teleport Ledger - Blockchain Package Tracking",
  description: "Tamper-proof package custody tracking with blockchain technology",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <OfflineIndicator />
        <PerformanceMonitor />
        <Analytics />
      </body>
    </html>
  )
}
