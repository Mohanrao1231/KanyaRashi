import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, MapPin, Clock, CheckCircle, Truck, User, Camera } from "lucide-react"

async function getPackageData(trackingNumber: string) {
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

  const { data: packageData } = await supabase
    .from("packages")
    .select(`
      *,
      sender:sender_id(full_name, email),
      recipient:recipient_id(full_name, email),
      courier:current_courier_id(full_name, email)
    `)
    .eq("tracking_number", trackingNumber)
    .single()

  if (!packageData) {
    return null
  }

  const { data: transfers } = await supabase
    .from("custody_transfers")
    .select(`
      *,
      from_user:from_user_id(full_name),
      to_user:to_user_id(full_name)
    `)
    .eq("package_id", packageData.id)
    .order("created_at", { ascending: true })

  const { data: photos } = await supabase
    .from("package_photos")
    .select("*")
    .eq("package_id", packageData.id)
    .order("created_at", { ascending: false })

  return {
    package: packageData,
    transfers: transfers || [],
    photos: photos || [],
  }
}

export default async function TrackingPage({ params }: { params: { tracking: string } }) {
  const data = await getPackageData(params.tracking)

  if (!data) {
    notFound()
  }

  const { package: pkg, transfers, photos } = data

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_pickup":
        return "border-slate-500 text-slate-400"
      case "in_transit":
        return "border-blue-500 text-blue-400"
      case "out_for_delivery":
        return "border-orange-500 text-orange-400"
      case "delivered":
        return "border-green-500 text-green-400"
      case "exception":
        return "border-red-500 text-red-400"
      default:
        return "border-slate-500 text-slate-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_pickup":
        return <Package className="h-5 w-5" />
      case "in_transit":
        return <Truck className="h-5 w-5" />
      case "out_for_delivery":
        return <MapPin className="h-5 w-5" />
      case "delivered":
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Package Tracking</h1>
          <p className="text-slate-400">Tracking Number: {pkg.tracking_number}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Package Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  {getStatusIcon(pkg.status)}
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className={getStatusColor(pkg.status)}>
                    {pkg.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    Last updated: {new Date(pkg.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">From: {pkg.pickup_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">To: {pkg.delivery_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Estimated Delivery: {new Date(pkg.estimated_delivery).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custody Timeline */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400">Custody Timeline</CardTitle>
                <CardDescription className="text-slate-400">Complete chain of custody for this package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transfers.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No custody transfers yet</p>
                  ) : (
                    transfers.map((transfer, index) => (
                      <div key={transfer.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          {index < transfers.length - 1 && <div className="w-0.5 h-8 bg-slate-700 mt-2"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{transfer.transfer_type.replace("_", " ")}</h4>
                              <p className="text-sm text-slate-400">
                                From: {transfer.from_user?.full_name || "System"} → To:{" "}
                                {transfer.to_user?.full_name || "System"}
                              </p>
                              {transfer.location && (
                                <p className="text-xs text-slate-500">Location: {transfer.location}</p>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(transfer.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Package Details */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-slate-400">Description:</span>
                  <p className="text-white">{pkg.description}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Weight:</span>
                  <p className="text-white">{pkg.weight} kg</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Dimensions:</span>
                  <p className="text-white">{pkg.dimensions}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Priority:</span>
                  <Badge variant="outline" className="ml-2">
                    {pkg.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Value:</span>
                  <p className="text-white">₹{pkg.declared_value}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-slate-400">Sender:</span>
                  <p className="text-white">{pkg.sender?.full_name}</p>
                  <p className="text-xs text-slate-500">{pkg.sender?.email}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Recipient:</span>
                  <p className="text-white">{pkg.recipient?.full_name}</p>
                  <p className="text-xs text-slate-500">{pkg.recipient?.email}</p>
                </div>
                {pkg.courier && (
                  <div>
                    <span className="text-sm text-slate-400">Current Courier:</span>
                    <p className="text-white">{pkg.courier.full_name}</p>
                    <p className="text-xs text-slate-500">{pkg.courier.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Photos */}
            {photos.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Package Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.slice(0, 4).map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center"
                      >
                        <Camera className="h-8 w-8 text-slate-600" />
                      </div>
                    ))}
                  </div>
                  {photos.length > 4 && (
                    <Button variant="outline" className="w-full mt-3 border-slate-600 bg-transparent">
                      View All Photos ({photos.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
