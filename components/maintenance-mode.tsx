import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock } from "lucide-react"

interface MaintenanceModeProps {
  message?: string
  estimatedTime?: string
}

export function MaintenanceMode({
  message = "We're currently performing scheduled maintenance to improve your experience.",
  estimatedTime = "30 minutes",
}: MaintenanceModeProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-orange-500" />
          </div>
          <Badge variant="secondary" className="mx-auto mb-4">
            <Clock className="w-3 h-3 mr-1" />
            Maintenance Mode
          </Badge>
          <CardTitle className="text-2xl">Under Maintenance</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Estimated completion time: <span className="font-medium text-foreground">{estimatedTime}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Thank you for your patience. We'll be back shortly!</p>
        </CardContent>
      </Card>
    </div>
  )
}
