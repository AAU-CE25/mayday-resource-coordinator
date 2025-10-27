"use client"

import { useEffect, useRef } from "react"
import { useEvents } from "@/hooks/use-events"

interface MapViewProps {
  selectedEvent: string | null
  onEventSelect: (eventId: string | null) => void
}

export function MapView({ selectedEvent, onEventSelect }: MapViewProps) {
  const { data: events } = useEvents()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || leafletMapRef.current) return

    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMapRef.current) return

      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Initialize map
      const map = L.map(mapRef.current).setView([-12.8432905, 175.065665], 13)
      leafletMapRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Add markers for events
      if (events) {
        events.forEach((event: any) => {
          const marker = L.marker([event.location.latitude, event.location.longitude]).addTo(map)

          const priorityColor = event.priority === 1 ? "bg-chart-5" : event.priority === 2 ? "bg-chart-4" : "bg-chart-3"
          const statusColor =
            event.status === "active" ? "bg-chart-5" : event.status === "pending" ? "bg-chart-4" : "bg-chart-3"

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-foreground">${event.description}</h3>
              <p class="text-sm text-muted-foreground">${event.location.address}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="rounded px-2 py-1 text-xs font-medium ${priorityColor} text-white">
                  Priority ${event.priority}
                </span>
                <span class="rounded px-2 py-1 text-xs font-medium ${statusColor} text-white">
                  ${event.status}
                </span>
              </div>
            </div>
          `)

          marker.on("click", () => {
            onEventSelect(event.id)
          })
        })
      }
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [events, onEventSelect])

  return (
    <div className="relative z-0 h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
