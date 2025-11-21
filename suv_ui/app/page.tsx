"use client"

import { useState, useEffect } from "react"
import type { TabType } from "@/lib/types"
import { TabNavigation } from "@/components/app/tab-navigation"
import { EventsFeed } from "@/components/app/events-feed"
import { ProfileView } from "@/components/app/profile-view"
import { MyEventView } from "@/components/app/my-event-view"
import { useAuth } from "@/lib/auth-context"
import { useActiveAssignment } from "@/hooks/use-active-assignment"

export default function Home() {
  const { user } = useAuth()
  const { activeEvent, volunteerId, loading, refresh, leaveEvent } = useActiveAssignment(user)
  
  // Determine active tab based on assignment state
  const activeTab: TabType = activeEvent && volunteerId ? "my-event" : "events"
  const [currentTab, setCurrentTab] = useState<TabType>(activeTab)

  // Update current tab when active tab changes
  useEffect(() => {
    setCurrentTab(activeTab)
  }, [activeTab])

  const handleLeaveEvent = async () => {
    try {
      await leaveEvent()
      setCurrentTab("events")
    } catch (error) {
      console.error("Failed to leave event:", error)
    }
  }

  const handleRefresh = async () => {
    await refresh()
  }

  if (loading && user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SUV Response</h1>
            <p className="text-sm text-gray-600">
              {activeEvent ? "Active Assignment" : "Volunteer Portal"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === "events" && <EventsFeed />}
        {currentTab === "my-event" && activeEvent && (
          <MyEventView event={activeEvent} onLeaveEvent={handleLeaveEvent} />
        )}
        {currentTab === "profile" && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <TabNavigation 
        activeTab={currentTab} 
        onTabChange={setCurrentTab}
        showMyEvent={!!activeEvent}
      />
    </div>
  )
}
