"use client"

import { useEffect, useRef } from "react"
import { useEvents } from "@/hooks/use-events"

interface MapViewProps {
  selectedEvent: string | null
  onEventSelect: (eventId: string | null) => void
}

const getMarkerColor = (status: string): string => {
  switch (status) {
    case "active":
      return "#ef4444" // red for active emergencies
    case "pending":
      return "#f97316" // orange for pending
    case "resolved":
      return "#22c55e" // green for resolved
    case "on_hold":
      return "#eab308" // yellow for on hold
    default:
      return "#6b7280" // gray as fallback
  }
}

const createMarkerIcon = (L: any, color: string) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>`,
    )}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  })
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
      const map = L.map(mapRef.current).setView([55.6761, 12.5683], 11)
      leafletMapRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Add markers for events
      if (events) {
        events.forEach((event: any) => {
          const markerColor = getMarkerColor(event.status)
          const customIcon = createMarkerIcon(L, markerColor)
          const marker = L.marker([event.location.latitude, event.location.longitude], {
            icon: customIcon,
          }).addTo(map)

          const priorityColor = event.priority === 1 ? "bg-chart-5" : event.priority === 2 ? "bg-chart-4" : "bg-chart-3"
          const statusColor =
            event.status === "active" ? "bg-chart-5" : event.status === "pending" ? "bg-chart-4" : "bg-chart-3"

          marker.bindPopup(`
          <div class="p-3 rounded-lg" style="background-color: rgba(20, 20, 20, 0.95); backdrop-filter: blur(4px);">
            <h3 class="font-semibold text-white">${event.description}</h3>
            <p class="text-sm text-gray-300 mt-1">${event.location.address.street}</p>
            <div class="mt-3 flex items-center gap-2">
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
