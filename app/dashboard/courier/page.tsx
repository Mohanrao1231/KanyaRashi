import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, MapPin, Clock, CheckCircle } from "lucide-react"

async function getCourierData(userId: string) {
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

  const { data: availablePackages } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "pending_pickup")
    .order("created_at", { ascending: false })

  const { data: activeDeliveries } = await supabase
    .from("packages")
    .select("*")
    .eq("current_courier_id", userId)
    .in("status", ["in_transit", "out_for_delivery"])
    .order("created_at", { ascending: false })

  const { data: completedDeliveries } = await supabase
    .from("packages")
    .select("*")
    .eq("current_courier_id", userId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(10)

  return {
    availablePackages: availablePackages || [],
    activeDeliveries: activeDeliveries || [],
    completedDeliveries: completedDeliveries || [],
  }
}

export default async function CourierDashboard() {
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

  if (!profile || profile.role !== "courier") {
    redirect("/dashboard/sender")
  }

  const { availablePackages, activeDeliveries, completedDeliveries } = await getCourierData(user.id)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Courier Dashboard</h1>
          <p className="text-slate-400">Welcome back, {profile?.full_name || "Courier"}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Available Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{availablePackages.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{activeDeliveries.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {
                  completedDeliveries.filter(
                    (p) => new Date(p.delivered_at).toDateString() === new Date().toDateString(),
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">₹0.00</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Packages */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Available Packages
              </CardTitle>
              <CardDescription className="text-slate-400">Packages ready for pickup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availablePackages.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No packages available for pickup</p>
                ) : (
                  availablePackages.map((pkg) => (
                    <div key={pkg.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                          <p className="text-sm text-slate-400">{pkg.description}</p>
                        </div>
                        <Badge variant="outline" className="border-blue-500 text-blue-400">
                          {pkg.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {pkg.pickup_address}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Weight: {pkg.weight}kg</span>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Accept Delivery
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Deliveries */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Deliveries
              </CardTitle>
              <CardDescription className="text-slate-400">Packages currently in your custody</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDeliveries.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No active deliveries</p>
                ) : (
                  activeDeliveries.map((pkg) => (
                    <div key={pkg.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                          <p className="text-sm text-slate-400">{pkg.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            pkg.status === "in_transit"
                              ? "border-orange-500 text-orange-400"
                              : "border-blue-500 text-blue-400"
                          }
                        >
                          {pkg.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          To: {pkg.delivery_address}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">
                          ETA: {new Date(pkg.estimated_delivery).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-slate-600 bg-transparent">
                            Update Status
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Mark Delivered
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Completions */}
        <Card className="bg-slate-900 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Completions
            </CardTitle>
            <CardDescription className="text-slate-400">Your recently completed deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedDeliveries.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No completed deliveries yet</p>
              ) : (
                completedDeliveries.map((pkg) => (
                  <div key={pkg.id} className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                      <p className="text-sm text-slate-400">
                        Delivered on {new Date(pkg.delivered_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      Completed
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
