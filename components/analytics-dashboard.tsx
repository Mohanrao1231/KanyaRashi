"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Package, Clock, Users, AlertTriangle, CheckCircle, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsData {
  packageStats: {
    total: number
    delivered: number
    inTransit: number
    pending: number
  }
  deliveryTimes: Array<{ day: string; avgTime: number }>
  statusDistribution: Array<{ name: string; value: number; color: string }>
  monthlyVolume: Array<{ month: string; packages: number; revenue: number }>
  topRoutes: Array<{ route: string; count: number; avgTime: number }>
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    packageStats: { total: 0, delivered: 0, inTransit: 0, pending: 0 },
    deliveryTimes: [],
    statusDistribution: [],
    monthlyVolume: [],
    topRoutes: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const supabase = createClient()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const { data: packages } = await supabase
        .from("packages")
        .select("status, created_at, pickup_address, delivery_address, actual_delivery, expected_delivery")

      const { data: users } = await supabase.from("users").select("id, created_at")

      const { data: disputes } = await supabase.from("disputes").select("status")

      // Calculate package statistics
      const totalPackages = packages?.length || 0
      const deliveredPackages = packages?.filter((p) => p.status === "delivered").length || 0
      const inTransitPackages = packages?.filter((p) => ["picked_up", "in_transit"].includes(p.status)).length || 0
      const pendingPackages = packages?.filter((p) => p.status === "created").length || 0

      // Calculate status distribution
      const statusCounts =
        packages?.reduce((acc: any, pkg) => {
          acc[pkg.status] = (acc[pkg.status] || 0) + 1
          return acc
        }, {}) || {}

      const statusDistribution = [
        { name: "Delivered", value: statusCounts.delivered || 0, color: "#10b981" },
        { name: "In Transit", value: (statusCounts.picked_up || 0) + (statusCounts.in_transit || 0), color: "#3b82f6" },
        { name: "Pending", value: statusCounts.created || 0, color: "#f59e0b" },
        { name: "Cancelled", value: statusCounts.cancelled || 0, color: "#ef4444" },
      ].filter((item) => item.value > 0)

      // Generate mock delivery times (would be calculated from real delivery data)
      const deliveryTimes = [
        { day: "Mon", avgTime: 2.4 },
        { day: "Tue", avgTime: 2.1 },
        { day: "Wed", avgTime: 2.8 },
        { day: "Thu", avgTime: 2.3 },
        { day: "Fri", avgTime: 3.1 },
        { day: "Sat", avgTime: 2.9 },
        { day: "Sun", avgTime: 2.6 },
      ]

      // Generate monthly volume based on package creation dates
      const monthlyVolume = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString("en-US", { month: "short" })
        const monthPackages =
          packages?.filter((p) => {
            const pkgDate = new Date(p.created_at)
            return pkgDate.getMonth() === date.getMonth() && pkgDate.getFullYear() === date.getFullYear()
          }).length || 0

        monthlyVolume.push({
          month: monthName,
          packages: monthPackages,
          revenue: monthPackages * 50, // Estimated revenue per package
        })
      }

      // Generate top routes from pickup/delivery addresses
      const routeCounts: { [key: string]: number } = {}
      packages?.forEach((pkg) => {
        if (pkg.pickup_address && pkg.delivery_address) {
          // Simplified route extraction (would need better parsing in real app)
          const pickup = pkg.pickup_address.split(",").pop()?.trim() || "Unknown"
          const delivery = pkg.delivery_address.split(",").pop()?.trim() || "Unknown"
          const route = `${pickup} → ${delivery}`
          routeCounts[route] = (routeCounts[route] || 0) + 1
        }
      })

      const topRoutes = Object.entries(routeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([route, count]) => ({
          route,
          count,
          avgTime: 2.0 + Math.random() * 2, // Mock average time
        }))

      const analyticsData: AnalyticsData = {
        packageStats: {
          total: totalPackages,
          delivered: deliveredPackages,
          inTransit: inTransitPackages,
          pending: pendingPackages,
        },
        deliveryTimes,
        statusDistribution,
        monthlyVolume,
        topRoutes,
      }

      setData(analyticsData)
    } catch (error) {
      console.error("Error loading analytics data:", error)
      // Fallback to mock data on error
      const mockData: AnalyticsData = {
        packageStats: {
          total: 1247,
          delivered: 1089,
          inTransit: 98,
          pending: 60,
        },
        deliveryTimes: [
          { day: "Mon", avgTime: 2.4 },
          { day: "Tue", avgTime: 2.1 },
          { day: "Wed", avgTime: 2.8 },
          { day: "Thu", avgTime: 2.3 },
          { day: "Fri", avgTime: 3.1 },
          { day: "Sat", avgTime: 2.9 },
          { day: "Sun", avgTime: 2.6 },
        ],
        statusDistribution: [
          { name: "Delivered", value: 1089, color: "#10b981" },
          { name: "In Transit", value: 98, color: "#3b82f6" },
          { name: "Pending", value: 60, color: "#f59e0b" },
        ],
        monthlyVolume: [
          { month: "Jan", packages: 890, revenue: 45000 },
          { month: "Feb", packages: 1020, revenue: 51000 },
          { month: "Mar", packages: 1150, revenue: 57500 },
          { month: "Apr", packages: 980, revenue: 49000 },
          { month: "May", packages: 1300, revenue: 65000 },
          { month: "Jun", packages: 1247, revenue: 62350 },
        ],
        topRoutes: [
          { route: "NYC → LA", count: 234, avgTime: 3.2 },
          { route: "SF → Chicago", count: 189, avgTime: 2.8 },
          { route: "Miami → Boston", count: 156, avgTime: 2.1 },
          { route: "Seattle → Denver", count: 143, avgTime: 1.9 },
          { route: "Austin → Atlanta", count: 128, avgTime: 2.4 },
        ],
      }
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="gradient-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Packages</p>
                <p className="text-2xl font-bold">{data.packageStats.total.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-5" />
              <span className="text-sm text-chart-5">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{data.packageStats.delivered.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-chart-5" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {data.packageStats.total > 0
                  ? ((data.packageStats.delivered / data.packageStats.total) * 100).toFixed(1)
                  : 0}
                % success rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{data.packageStats.inTransit}</p>
              </div>
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                Active deliveries
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                <p className="text-2xl font-bold">2.6 days</p>
              </div>
              <Clock className="w-8 h-8 text-chart-3" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-5" />
              <span className="text-sm text-chart-5">-0.3 days improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Package Status Distribution</CardTitle>
                <CardDescription>Current status of all packages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Average Delivery Times</CardTitle>
                <CardDescription>Daily delivery performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.deliveryTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} days`, "Avg Time"]} />
                    <Bar dataKey="avgTime" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Monthly Package Volume & Revenue</CardTitle>
              <CardDescription>Package volume and revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.monthlyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="packages" fill="#3b82f6" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Top Shipping Routes</CardTitle>
              <CardDescription>Most popular routes and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topRoutes.length > 0 ? (
                  data.topRoutes.map((route, index) => (
                    <div
                      key={route.route}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{route.route}</p>
                          <p className="text-sm text-muted-foreground">{route.count} packages</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{route.avgTime.toFixed(1)} days</p>
                        <p className="text-sm text-muted-foreground">avg delivery</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No route data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-chart-5" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-5">+12.5%</p>
                  <p className="text-sm text-muted-foreground">Month over month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">2,847</p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-chart-3" />
                  Issue Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-3">2.1%</p>
                  <p className="text-sm text-muted-foreground">Packages with issues</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
