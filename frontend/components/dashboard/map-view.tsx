"use client";

import { useEffect, useRef } from "react";
import { useEvents } from "@/hooks/use-events";

interface MapViewProps {
  selectedEvent: string | null;
  onEventSelect: (eventId: string | null) => void;
  searchQuery: string;
  priorityFilter: string;
  statusFilter: string[];
}

const getMarkerColor = (status: string): string => {
  switch (status) {
    case "active":
      return "#ef4444"; // red for active emergencies
    case "pending":
      return "#f97316"; // orange for pending
    case "resolved":
      return "#22c55e"; // green for resolved
    case "on_hold":
      return "#eab308"; // yellow for on hold
    default:
      return "#6b7280"; // gray as fallback
  }
};

const createMarkerIcon = (L: any, color: string) => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>`
    )}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
};

export default function MapView({
  selectedEvent,
  onEventSelect,
  searchQuery,
  priorityFilter,
  statusFilter,
}: MapViewProps) {
  const { data: events } = useEvents();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    import("leaflet").then((L) => {
      // Initialize or reuse map
      if (!leafletMapRef.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([55.6761, 12.5683], 11);
        leafletMapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      }

      const map = leafletMapRef.current;

      // Remove old markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Filter events
      let filtered = events || [];
      if (priorityFilter !== "all") {
        filtered = filtered.filter(
          (e: any) => e.priority === parseInt(priorityFilter)
        );
      }
      if (statusFilter.length > 0) {
        filtered = filtered.filter((e: any) => statusFilter.includes(e.status));
      }
      if (searchQuery.trim() !== "") {
        filtered = filtered.filter((e: any) =>
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Add filtered markers
      filtered.forEach((event: any) => {
        // skip if no coordinates
        if (
          !event.location ||
          !event.location.latitude ||
          !event.location.longitude
        )
          return;

        const markerColor = getMarkerColor(event.status);
        const customIcon = createMarkerIcon(L, markerColor);
        const marker = L.marker(
          [event.location.latitude, event.location.longitude],
          {
            icon: customIcon,
          }
        ).addTo(map);

        marker.bindPopup(`
          <div class="p-3 rounded-lg" style="background-color: rgba(20, 20, 20, 0.95); backdrop-filter: blur(4px);">
            <h3 class="font-semibold text-white">${event.description}</h3>
            <p class="text-sm text-gray-300 mt-1">${
              event.location.address?.street || ""
            }</p>
            <div class="mt-3 flex items-center gap-2" style="display: flex; gap: 8px; align-items: center;">
              <span class="rounded px-2 py-1 text-xs font-medium text-white" style="background:${markerColor}; border-radius: 4px; padding: 4px 8px;">
                Priority ${event.priority}
              </span>
              <span class="rounded px-2 py-1 text-xs font-medium text-white" style="background:${markerColor}; border-radius: 4px; padding: 4px 8px;">
                ${event.status}
              </span>
              <span class="rounded px-2 py-1 text-xs font-medium text-white" style="background:rgba(77, 75, 75, 1); border-radius: 4px; padding: 4px 8px;">
                ${
                  typeof event.volunteers_count !== "undefined"
                    ? event.volunteers_count
                    : 0
                } Volunteers
              </span>
              <button id="assign-${
                event.id
              }" class="text-xs rounded px-2 py-1 text-white" style="background: #3b82f6; border: none; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-weight: 600;">+</button>
            </div>
          </div>
        `);

        // attach click handler for the assign link when popup opens
        marker.on("popupopen", () => {
          setTimeout(() => {
            try {
              const el = document.getElementById(`assign-${event.id}`);
              console.log("Found assign button:", el, "for event:", event.id);
              if (el) {
                el.addEventListener("click", (ev: any) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  console.log(
                    "Dispatching openAssignToEvent for event:",
                    event.id
                  );
                  window.dispatchEvent(
                    new CustomEvent("openAssignToEvent", { detail: event.id })
                  );
                });
              } else {
                console.error(
                  "Could not find assign button for event:",
                  event.id
                );
              }
            } catch (e) {
              console.error("Error attaching click handler:", e);
            }
          }, 100);
        });

        marker.on("click", () => {
          onEventSelect(event.id);
        });
      });
    });
  }, [events, searchQuery, priorityFilter, statusFilter]);

  return (
    <div className="relative z-0 h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
