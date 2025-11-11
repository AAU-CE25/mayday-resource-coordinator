"use client"

import { useState } from "react"
import MapView from "./map-view"
import { SidePanel } from "./side-panel"
import { Header } from "./dashboard-header"
import { MonitoringStats } from "./monitoring-stats"
import { MapFilterPane } from "./map-filter-pane"

export function EmergencyDashboard() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"events" | "volunteers" | "resources">("events")
  const [mapSearchQuery, setMapSearchQuery] = useState("")
  const [mapPriorityFilter, setMapPriorityFilter] = useState<string>("all")
  const [mapStatusFilter, setMapStatusFilter] = useState<string>("all")

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Map Section */}
        <div className="flex flex-1 flex-col">
          <MonitoringStats />
          <MapFilterPane
            searchQuery={mapSearchQuery}
            onSearchChange={setMapSearchQuery}
            priorityFilter={mapPriorityFilter}
            onPriorityChange={setMapPriorityFilter}
            statusFilter={mapStatusFilter}
            onStatusChange={setMapStatusFilter}
          />
          <MapView
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
            searchQuery={mapSearchQuery}
            priorityFilter={mapPriorityFilter}
            statusFilter={mapStatusFilter}
          />
        </div>

        {/* Side Panel */}
        <SidePanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
        />
      </div>
    </div>
  )
}
