"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventsList } from "./events-list"
import { VolunteersList } from "./volunteers-list"
import { ResourcesList } from "./resources-list"

interface SidePanelProps {
  activeTab: "events" | "volunteers" | "resources"
  onTabChange: (tab: "events" | "volunteers" | "resources") => void
  selectedEvent: string | null
  onEventSelect: (eventId: string | null) => void
}

export function SidePanel({ activeTab, onTabChange, selectedEvent, onEventSelect }: SidePanelProps) {
  return (
    <div className="w-96 border-l border-border bg-card">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="h-full">
        <TabsList className="w-full rounded-none border-b border-border bg-secondary">
          <TabsTrigger value="events" className="flex-1">
            Events
          </TabsTrigger>
          <TabsTrigger value="volunteers" className="flex-1">
            Volunteers
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="h-[calc(100%-3rem)] overflow-y-auto p-4">
          <EventsList selectedEvent={selectedEvent} onEventSelect={onEventSelect} />
        </TabsContent>

        <TabsContent value="volunteers" className="h-[calc(100%-3rem)] overflow-y-auto p-4">
          <VolunteersList />
        </TabsContent>

        <TabsContent value="resources" className="h-[calc(100%-3rem)] overflow-y-auto p-4">
          <ResourcesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
