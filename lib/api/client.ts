// API client utilities for frontend
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Package methods
  async getPackages(filters?: { status?: string; role?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.role) params.append("role", filters.role)

    const query = params.toString() ? `?${params.toString()}` : ""
    return this.request<{ packages: any[] }>(`/packages${query}`)
  }

  async createPackage(packageData: any) {
    return this.request<{ package: any }>("/packages", {
      method: "POST",
      body: JSON.stringify(packageData),
    })
  }

  async getPackage(id: string) {
    return this.request<{ package: any }>(`/packages/${id}`)
  }

  async updatePackage(id: string, updates: any) {
    return this.request<{ package: any }>(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async trackPackage(trackingNumber: string) {
    return this.request<{ package: any }>(`/packages/track/${trackingNumber}`)
  }

  // Transfer methods
  async getPackageTransfers(packageId: string) {
    return this.request<{ transfers: any[] }>(`/packages/${packageId}/transfers`)
  }

  async createTransfer(packageId: string, transferData: any) {
    return this.request<{ transfer: any }>(`/packages/${packageId}/transfers`, {
      method: "POST",
      body: JSON.stringify(transferData),
    })
  }

  // Notification methods
  async getNotifications(unreadOnly = false) {
    const query = unreadOnly ? "?unread=true" : ""
    return this.request<{ notifications: any[] }>(`/notifications${query}`)
  }

  async markNotificationRead(id: string) {
    return this.request<{ notification: any }>(`/notifications/${id}/read`, {
      method: "PUT",
    })
  }

  // User methods
  async getProfile() {
    return this.request<{ profile: any }>("/users/profile")
  }

  async updateProfile(profileData: any) {
    return this.request<{ profile: any }>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
  }

  // Analytics methods
  async getDashboardAnalytics() {
    return this.request<{ analytics: any }>("/analytics/dashboard")
  }
}

export const apiClient = new ApiClient()
