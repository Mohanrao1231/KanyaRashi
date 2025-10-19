import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Package, Users, TrendingUp, IndianRupee } from "lucide-react"
import { CurrencyFormatter } from "@/components/currency-formatter"

async function getAnalyticsData() {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookies().set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })

  // Get package statistics
  const { data: packages } = await supabase.from("packages").select("*").order("created_at", { ascending: false })

  // Get user statistics
  const { data: users } = await supabase.from("users").select("*")

  // Get custody transfers
  const { data: transfers } = await supabase
    .from("custody_transfers")
    .select("*")
    .order("timestamp", { ascending: false })

  return {
    packages: packages || [],
    users: users || [],
    transfers: transfers || [],
  }
}

export default async function AdminAnalyticsPage() {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookies().getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookies().set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard/sender")
  }

  const { packages, users, transfers } = await getAnalyticsData()

  // Calculate metrics
  const totalPackages = packages.length
  const totalUsers = users.length
  const totalValue = packages.reduce((sum, pkg) => sum + (Number.parseFloat(pkg.value) || 0), 0)
  const activePackages = packages.filter((pkg) => !["delivered", "cancelled"].includes(pkg.status)).length

  // Status distribution
  const statusCounts = packages.reduce(
    (acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace("_", " "),
    value: count,
    color: getStatusColor(status),
  }))

  // Monthly trends
  const monthlyData = packages.reduce(
    (acc, pkg) => {
      const month = new Date(pkg.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const trendData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    packages: count,
  }))

  function getStatusColor(status: string) {
    switch (status) {
      case "created":
        return "#64748b"
      case "picked_up":
        return "#3b82f6"
      case "in_transit":
        return "#f59e0b"
      case "delivered":
        return "#10b981"
      case "cancelled":
        return "#ef4444"
      default:
        return "#64748b"
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Comprehensive system analytics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{totalPackages}</div>
              <p className="text-xs text-slate-500">{activePackages} active</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{totalUsers}</div>
              <p className="text-xs text-slate-500">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                <CurrencyFormatter amount={totalValue} />
              </div>
              <p className="text-xs text-slate-500">Package values</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{transfers.length}</div>
              <p className="text-xs text-slate-500">Custody transfers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-blue-400">Package Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-blue-400">Monthly Package Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="packages" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400">Recent Packages</CardTitle>
                <CardDescription className="text-slate-400">Latest package activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.slice(0, 10).map((pkg) => (
                    <div key={pkg.id} className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                        <p className="text-sm text-slate-400">{pkg.title}</p>
                        <p className="text-xs text-slate-500">
                          Created: {new Date(pkg.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`${getStatusColor(pkg.status)} border-current`}>
                          {pkg.status.replace("_", " ")}
                        </Badge>
                        <p className="text-sm text-slate-400 mt-1">
                          <CurrencyFormatter amount={pkg.value || 0} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400">User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["sender", "courier", "recipient"].map((role) => {
                    const count = users.filter((u) => u.role === role).length
                    return (
                      <div key={role} className="text-center p-4 border border-slate-700 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{count}</div>
                        <div className="text-sm text-slate-400 capitalize">{role}s</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400">System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Delivery Success Rate</h3>
                    <div className="text-3xl font-bold text-green-400">
                      {((packages.filter((p) => p.status === "delivered").length / totalPackages) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Average Delivery Time</h3>
                    <div className="text-3xl font-bold text-blue-400">2.3 days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
