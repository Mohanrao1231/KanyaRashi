import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, MapPin, Clock, CheckCircle, Search, Bell } from "lucide-react"

async function getRecipientData(userId: string) {
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

  const { data: incomingPackages } = await supabase
    .from("packages")
    .select("*")
    .eq("recipient_id", userId)
    .in("status", ["pending_pickup", "in_transit", "out_for_delivery"])
    .order("created_at", { ascending: false })

  const { data: deliveredPackages } = await supabase
    .from("packages")
    .select("*")
    .eq("recipient_id", userId)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(10)

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    incomingPackages: incomingPackages || [],
    deliveredPackages: deliveredPackages || [],
    notifications: notifications || [],
  }
}

export default async function RecipientDashboard() {
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

  if (!profile || profile.role !== "recipient") {
    redirect("/dashboard/sender")
  }

  const { incomingPackages, deliveredPackages, notifications } = await getRecipientData(user.id)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Recipient Dashboard</h1>
          <p className="text-slate-400">Track your incoming packages, {profile?.full_name || "User"}</p>
        </div>

        {/* Quick Track */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Track
            </CardTitle>
            <CardDescription className="text-slate-400">Enter a tracking number to get instant updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input placeholder="Enter tracking number..." className="bg-slate-800 border-slate-700 text-white" />
              <Button className="bg-blue-600 hover:bg-blue-700">Track Package</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Incoming Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{incomingPackages.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Out for Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {incomingPackages.filter((p) => p.status === "out_for_delivery").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Delivered This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {deliveredPackages.filter((p) => new Date(p.delivered_at).getMonth() === new Date().getMonth()).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{notifications.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incoming Packages */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Incoming Packages
                </CardTitle>
                <CardDescription className="text-slate-400">Packages on their way to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomingPackages.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No incoming packages</p>
                  ) : (
                    incomingPackages.map((pkg) => (
                      <div key={pkg.id} className="border border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                            <p className="text-sm text-slate-400">{pkg.description}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              pkg.status === "out_for_delivery"
                                ? "border-orange-500 text-orange-400"
                                : pkg.status === "in_transit"
                                  ? "border-blue-500 text-blue-400"
                                  : "border-slate-500 text-slate-400"
                            }
                          >
                            {pkg.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            From: {pkg.pickup_address}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ETA: {new Date(pkg.estimated_delivery).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Priority: {pkg.priority}</span>
                          <Button size="sm" variant="outline" className="border-slate-600 bg-transparent">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription className="text-slate-400">Latest updates on your packages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="border-b border-slate-800 pb-3">
                      <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                      <span className="text-xs text-slate-500">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <Card className="bg-slate-900 border-slate-800 mt-8">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Deliveries
            </CardTitle>
            <CardDescription className="text-slate-400">Your recently delivered packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveredPackages.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No delivered packages yet</p>
              ) : (
                deliveredPackages.map((pkg) => (
                  <div key={pkg.id} className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-semibold text-white">{pkg.tracking_number}</h3>
                      <p className="text-sm text-slate-400">
                        Delivered on {new Date(pkg.delivered_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-green-500 text-green-400 mb-2">
                        Delivered
                      </Badge>
                      <br />
                      <Button size="sm" variant="outline" className="border-slate-600 text-xs bg-transparent">
                        View Receipt
                      </Button>
                    </div>
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
