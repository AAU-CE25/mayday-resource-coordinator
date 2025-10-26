"use client"

import { useState } from "react"
import { MapView } from "./map-view"
import { SidePanel } from "./side-panel"
import { Header } from "./dashboard-header"
import { MonitoringStats } from "./monitoring-stats"

export function EmergencyDashboard() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"events" | "volunteers" | "resources">("events")

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Map Section */}
        <div className="flex flex-1 flex-col">
          <MonitoringStats />
          <MapView selectedEvent={selectedEvent} onEventSelect={setSelectedEvent} />
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
