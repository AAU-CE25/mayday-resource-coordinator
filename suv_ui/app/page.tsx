"use client"

import { useState, useEffect } from "react"
import type { TabType, Event, Volunteer } from "@/lib/types"
import { TabNavigation } from "@/components/tab-navigation"
import { EventsFeed } from "@/components/events-feed"
import { ProfileView } from "@/components/profile-view"
import { MyEventView } from "@/components/my-event-view"
import { useAuth } from "@/lib/auth-context"
import { fetchActiveVolunteers, fetchEvents, completeVolunteer } from "@/lib/api-client"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("events")
  const { user } = useAuth()
  const [myActiveEvent, setMyActiveEvent] = useState<Event | null>(null)
  const [myVolunteerId, setMyVolunteerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user has an active volunteer assignment
  useEffect(() => {
    const checkActiveAssignment = async () => {
      if (!user) {
        setMyActiveEvent(null)
        setMyVolunteerId(null)
        setLoading(false)
        return
      }

      try {
        // Fetch all events to check which one the user is volunteering for
        const events = await fetchEvents()
        
        // Check each event for the user's active volunteer status
        for (const event of events) {
          const volunteers = await fetchActiveVolunteers(event.id)
          const myVolunteer = volunteers.find(
            (v: Volunteer) => v.user.id === user.id && v.status === 'active'
          )
          
          if (myVolunteer) {
            setMyActiveEvent(event)
            setMyVolunteerId(myVolunteer.id)
            setActiveTab("my-event")
            break
          }
        }
      } catch (error) {
        console.error("Failed to check active assignment:", error)
      } finally {
        setLoading(false)
      }
    }

    checkActiveAssignment()
    
    // Re-check every 10 seconds for updates
    const interval = setInterval(checkActiveAssignment, 10000)
    return () => clearInterval(interval)
  }, [user])

  const handleLeaveEvent = async () => {
    if (!myVolunteerId) return

    try {
      await completeVolunteer(myVolunteerId)
      setMyActiveEvent(null)
      setMyVolunteerId(null)
      setActiveTab("events")
    } catch (error) {
      console.error("Failed to leave event:", error)
    }
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
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">SUV Response</h1>
          <p className="text-sm text-gray-600">
            {myActiveEvent ? "Active Assignment" : "Volunteer Portal"}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "events" && <EventsFeed />}
        {activeTab === "my-event" && myActiveEvent && (
          <MyEventView event={myActiveEvent} onLeaveEvent={handleLeaveEvent} />
        )}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        showMyEvent={!!myActiveEvent}
      />
    </div>
  )
}
