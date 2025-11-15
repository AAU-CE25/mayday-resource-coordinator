"use client"

import { useState } from "react"
import type { TabType } from "@/lib/types"
import { TabNavigation } from "@/components/tab-navigation"
import { EventsFeed } from "@/components/events-feed"
import { ProfileView } from "@/components/profile-view"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("events")

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">SUV Response</h1>
          <p className="text-sm text-gray-600">Volunteer Portal</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "events" && <EventsFeed />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
