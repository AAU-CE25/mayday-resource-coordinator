"use client"

import type { TabType } from "@/lib/types"

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  showMyEvent?: boolean
}

/**
 * Bottom tab navigation component for mobile
 */
export function TabNavigation({ activeTab, onTabChange, showMyEvent = false }: TabNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        <button
          onClick={() => onTabChange("events")}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
            activeTab === "events"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          aria-label="Events tab"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs font-medium">Events</span>
        </button>

        {showMyEvent && (
          <button
            onClick={() => onTabChange("my-event")}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors relative ${
              activeTab === "my-event"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            aria-label="My Event tab"
          >
            <div className="relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <span className="text-xs font-medium">My Event</span>
          </button>
        )}

        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
            activeTab === "profile"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          aria-label="Profile tab"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  )
}
