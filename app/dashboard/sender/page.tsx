"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, Search, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface PackageType {
  id: string
  tracking_number: string
  recipient_name: string
  recipient_address: string
  status: string
  created_at: string
  estimated_delivery: string
}

export default function SenderDashboard() {
  const [packages, setPackages] = useState<PackageType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkUser()
    fetchPackages()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setUser(user)
  }

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error("Error fetching packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "in_transit":
        return <Clock className="h-4 w-4 text-blue-400" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        return <TrendingUp className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-900/20 text-green-400 border-green-800"
      case "in_transit":
        return "bg-blue-900/20 text-blue-400 border-blue-800"
      case "pending":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-800"
      default:
        return "bg-slate-900/20 text-slate-400 border-slate-800"
    }
  }

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: packages.length,
    pending: packages.filter((p) => p.status === "pending").length,
    inTransit: packages.filter((p) => p.status === "in_transit").length,
    delivered: packages.filter((p) => p.status === "delivered").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Sender Dashboard</h1>
              <p className="text-slate-400">Manage your shipments and track deliveries</p>
            </div>
            <Button onClick={() => router.push("/dashboard/sender/create")} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Package
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Packages</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Transit</p>
                  <p className="text-2xl font-bold text-white">{stats.inTransit}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Delivered</p>
                  <p className="text-2xl font-bold text-white">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Packages List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Your Packages</CardTitle>
                <CardDescription className="text-slate-400">Track and manage all your shipments</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No packages found</h3>
                <p className="text-slate-400 mb-4">
                  {packages.length === 0
                    ? "You haven't created any packages yet."
                    : "No packages match your search criteria."}
                </p>
                <Button
                  onClick={() => router.push("/dashboard/sender/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Package
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/sender/packages/${pkg.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(pkg.status)}
                        <div>
                          <h3 className="text-white font-medium">{pkg.tracking_number}</h3>
                          <p className="text-slate-400 text-sm">To: {pkg.recipient_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(pkg.status)}>{pkg.status.replace("_", " ")}</Badge>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Created</p>
                          <p className="text-white text-sm">{new Date(pkg.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
