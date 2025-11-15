"use client"

import type { TabType } from "@/lib/types"

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

/**
 * Bottom tab navigation component for mobile
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
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
