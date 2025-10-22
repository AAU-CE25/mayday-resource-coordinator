"use client"

import { useStats } from "@/hooks/use-stats"
import { AlertCircle, Users, Package, MapPin } from "lucide-react"
import { LiveStatusIndicator } from "./live-status-indicator"

export function MonitoringStats() {
  const { data: stats } = useStats()

  const statItems = [
    {
      label: "Active Events",
      value: stats?.activeEvents || 0,
      icon: AlertCircle,
      color: "text-chart-5",
    },
    {
      label: "Volunteers",
      value: stats?.totalVolunteers || 0,
      icon: Users,
      color: "text-chart-1",
    },
    {
      label: "Resources Available",
      value: stats?.resourcesAvailable || 0,
      icon: Package,
      color: "text-chart-2",
    },
    {
      label: "Locations",
      value: stats?.totalLocations || 0,
      icon: MapPin,
      color: "text-chart-3",
    },
  ]

  return (
    <div className="space-y-3 border-b border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">System Overview</h2>
        <LiveStatusIndicator />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            <div className={`rounded-lg bg-background p-2 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
