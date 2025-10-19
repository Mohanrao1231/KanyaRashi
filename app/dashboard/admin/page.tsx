"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Package,
  Truck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield,
  Database,
  Settings,
  Bell,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalUsers: 0,
    activeCouriers: 0,
    pendingDisputes: 0,
    systemAlerts: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // 🔑 get role from your users/profiles table
      const { data: profile } = await supabase
        .from("users") // if your table is called "profiles", change it here
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile?.role) {
        router.push("/unauthorized")
        return
      }

      // ✅ Redirect based on role
      switch (profile.role) {
        case "admin":
          // stay on this dashboard
          break
        case "sender":
          router.push("/dashboard/sender")
          return
        case "recipient":
          router.push("/dashboard/recipient")
          return
        case "courier":
          router.push("/dashboard/courier")
          return
        default:
          router.push("/unauthorized")
          return
      }

      // Load dashboard data only if user is admin
      await loadDashboardData()
    } catch (error) {
      console.error("Error checking access:", error)
      router.push("/unauthorized")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load statistics
      const [packagesRes, usersRes, couriersRes, disputesRes] = await Promise.all([
        supabase.from("packages").select("status"),
        supabase.from("users").select("role"),
        supabase.from("users").select("role").eq("role", "courier"),
        supabase.from("disputes").select("status").eq("status", "open"),
      ])

      const totalPackages = packagesRes.data?.length || 0
      const activePackages =
        packagesRes.data?.filter((p) =>
          ["pending", "in_transit", "out_for_delivery"].includes(p.status)
        ).length || 0

      setStats({
        totalPackages,
        activePackages,
        totalUsers: usersRes.data?.length || 0,
        activeCouriers: couriersRes.data?.length || 0,
        pendingDisputes: disputesRes.data?.length || 0,
        systemAlerts: 2, // Mock data
      })

      // Load recent activity
      const { data: activity } = await supabase
        .from("custody_transfers")
        .select(`
          *,
          packages(tracking_number, description),
          from_user:users!custody_transfers_from_user_id_fkey(full_name),
          to_user:users!custody_transfers_to_user_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      setRecentActivity(activity || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Alerts ({stats.systemAlerts})
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalPackages}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-chart-2" />
                <span className="text-2xl font-bold">{stats.activePackages}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-chart-3" />
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Couriers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-chart-4" />
                <span className="text-2xl font-bold">{stats.activeCouriers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold">{stats.pendingDisputes}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-chart-5" />
                <Badge variant="secondary" className="text-xs">
                  Healthy
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="packages">Package Overview</TabsTrigger>
            <TabsTrigger value="system">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest custody transfers and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-blue" />
                        <div>
                          <p className="font-medium">Package {activity.packages?.tracking_number} transferred</p>
                          <p className="text-sm text-muted-foreground">
                            From {activity.from_user?.full_name} to {activity.to_user?.full_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{new Date(activity.created_at).toLocaleDateString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span>Total registered users: {stats.totalUsers}</span>
                    </div>
                    <Button size="sm">View All Users</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-chart-4" />
                      <span>Active couriers: {stats.activeCouriers}</span>
                    </div>
                    <Button size="sm">Manage Couriers</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Package Overview</CardTitle>
                <CardDescription>System-wide package statistics and management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-chart-2" />
                      <span className="font-medium">Active Deliveries</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.activePackages}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-chart-3" />
                      <span className="font-medium">Total Processed</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalPackages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent system events and blockchain transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-chart-5 rounded-full" />
                    <span className="text-sm">Blockchain sync completed - 2 minutes ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm">Database backup completed - 1 hour ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-chart-2 rounded-full" />
                    <span className="text-sm">IPFS storage health check - 3 hours ago</span>
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
