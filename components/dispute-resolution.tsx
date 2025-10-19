"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Dispute {
  id: string
  package_id: string
  tracking_number: string
  type: "damage" | "missing" | "delay" | "other"
  status: "open" | "investigating" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  description: string
  created_at: string
  updated_at: string
  resolution?: string
  evidence_photos?: string[]
  packages?: {
    tracking_number: string
    title: string
    description: string
  }
  users?: {
    full_name: string
    email: string
  }
}

export function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [newDispute, setNewDispute] = useState({
    package_id: "",
    tracking_number: "",
    type: "",
    title: "",
    description: "",
    priority: "medium",
  })
  const [loading, setLoading] = useState(false)
  const [showNewDispute, setShowNewDispute] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDisputes()
  }, [])

  const loadDisputes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/disputes")
      if (!response.ok) {
        throw new Error("Failed to fetch disputes")
      }

      const data = await response.json()
      setDisputes(data.disputes || [])
    } catch (error) {
      console.error("Error loading disputes:", error)
      toast({
        title: "Error loading disputes",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createDispute = async () => {
    if (!newDispute.package_id || !newDispute.type || !newDispute.title || !newDispute.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_id: newDispute.package_id,
          tracking_number: newDispute.tracking_number,
          type: newDispute.type,
          title: newDispute.title,
          description: newDispute.description,
          priority: newDispute.priority,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create dispute")
      }

      const data = await response.json()
      setDisputes((prev) => [data.dispute, ...prev])
      setNewDispute({
        package_id: "",
        tracking_number: "",
        type: "",
        title: "",
        description: "",
        priority: "medium",
      })
      setShowNewDispute(false)

      toast({
        title: "Dispute created",
        description: "Your dispute has been submitted and is under review",
      })
    } catch (error) {
      console.error("Error creating dispute:", error)
      toast({
        title: "Failed to create dispute",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateDisputeStatus = async (disputeId: string, status: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, resolution }),
      })

      if (!response.ok) {
        throw new Error("Failed to update dispute")
      }

      const data = await response.json()
      setDisputes((prev) => prev.map((d) => (d.id === disputeId ? data.dispute : d)))

      toast({
        title: "Dispute updated",
        description: `Dispute status changed to ${status}`,
      })
    } catch (error) {
      console.error("Error updating dispute:", error)
      toast({
        title: "Failed to update dispute",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-chart-3"
      case "investigating":
        return "bg-primary"
      case "resolved":
        return "bg-chart-5"
      case "closed":
        return "bg-muted"
      default:
        return "bg-muted"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-destructive"
      case "high":
        return "text-chart-3"
      case "medium":
        return "text-primary"
      case "low":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "damage":
        return <AlertTriangle className="w-4 h-4" />
      case "missing":
        return <XCircle className="w-4 h-4" />
      case "delay":
        return <Clock className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dispute Resolution</h2>
          <p className="text-muted-foreground">Manage package disputes and resolutions</p>
        </div>
        <Button onClick={() => setShowNewDispute(true)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          New Dispute
        </Button>
      </div>

      {showNewDispute && (
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Create New Dispute</CardTitle>
            <CardDescription>Report an issue with a package delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_id">Package ID</Label>
                <Input
                  id="package_id"
                  value={newDispute.package_id}
                  onChange={(e) => setNewDispute((prev) => ({ ...prev, package_id: e.target.value }))}
                  placeholder="Enter package ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  value={newDispute.tracking_number}
                  onChange={(e) => setNewDispute((prev) => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="Enter tracking number"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Dispute Type</Label>
                <Select
                  value={newDispute.type}
                  onValueChange={(value) => setNewDispute((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispute type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Package Damage</SelectItem>
                    <SelectItem value="missing">Missing Package</SelectItem>
                    <SelectItem value="delay">Delivery Delay</SelectItem>
                    <SelectItem value="other">Other Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newDispute.priority}
                  onValueChange={(value) => setNewDispute((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newDispute.title}
                onChange={(e) => setNewDispute((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDispute.description}
                onChange={(e) => setNewDispute((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={createDispute} disabled={loading}>
                {loading ? "Creating..." : "Create Dispute"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewDispute(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Disputes</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : disputes.length === 0 ? (
            <Card className="gradient-card">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No disputes found</p>
              </CardContent>
            </Card>
          ) : (
            disputes.map((dispute) => (
              <Card
                key={dispute.id}
                className="gradient-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedDispute(dispute)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(dispute.type)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">#{dispute.tracking_number}</p>
                          <Badge variant="secondary" className={getStatusColor(dispute.status)}>
                            {dispute.status}
                          </Badge>
                          <span className={`text-sm font-medium ${getPriorityColor(dispute.priority)}`}>
                            {dispute.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium">{dispute.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {dispute.type.replace("_", " ")} • {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm">{dispute.description}</p>
                        {dispute.resolution && (
                          <div className="mt-2 p-3 bg-chart-5/10 border border-chart-5/20 rounded-lg">
                            <p className="text-sm text-chart-5">
                              <strong>Resolution:</strong> {dispute.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dispute.evidence_photos && dispute.evidence_photos.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Camera className="w-3 h-3 mr-1" />
                          {dispute.evidence_photos.length} photos
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Updated {new Date(dispute.updated_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="open">
          <div className="space-y-4">
            {disputes
              .filter((d) => d.status === "open")
              .map((dispute) => (
                <Card key={dispute.id} className="gradient-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{dispute.tracking_number}</p>
                        <p className="text-sm text-muted-foreground">{dispute.description}</p>
                      </div>
                      <Button size="sm" onClick={() => updateDisputeStatus(dispute.id, "investigating")}>
                        Start Investigation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="investigating">
          <div className="space-y-4">
            {disputes
              .filter((d) => d.status === "investigating")
              .map((dispute) => (
                <Card key={dispute.id} className="gradient-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{dispute.tracking_number}</p>
                        <p className="text-sm text-muted-foreground">{dispute.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateDisputeStatus(dispute.id, "resolved", "Issue resolved through investigation")
                          }
                        >
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateDisputeStatus(dispute.id, "closed")}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="space-y-4">
            {disputes
              .filter((d) => d.status === "resolved")
              .map((dispute) => (
                <Card key={dispute.id} className="gradient-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-chart-5 mt-1" />
                      <div className="space-y-2">
                        <p className="font-medium">#{dispute.tracking_number}</p>
                        <p className="text-sm text-muted-foreground">{dispute.description}</p>
                        {dispute.resolution && (
                          <div className="p-3 bg-chart-5/10 border border-chart-5/20 rounded-lg">
                            <p className="text-sm text-chart-5">
                              <strong>Resolution:</strong> {dispute.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
