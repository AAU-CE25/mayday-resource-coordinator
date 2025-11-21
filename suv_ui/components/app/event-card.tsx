import type { Event } from "@/lib/types"

interface EventCardProps {
  event: Event
  onClick: () => void
}

/**
 * Individual event card component
 * Displays event details in a mobile-friendly card format
 */
export function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-DK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("active") || statusLower.includes("ongoing")) {
      return "bg-red-100 text-red-800"
    }
    if (statusLower.includes("resolved") || statusLower.includes("complete")) {
      return "bg-green-100 text-green-800"
    }
    return "bg-yellow-100 text-yellow-800"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return { text: "Critical", color: "text-red-600" }
    if (priority === 2) return { text: "High", color: "text-orange-600" }
    if (priority === 3) return { text: "Medium", color: "text-yellow-600" }
    return { text: "Low", color: "text-blue-600" }
  }

  const priorityInfo = getPriorityLabel(event.priority)
  const locationText = event.location.address?.city || event.location.address?.street || "Location not specified"

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 active:scale-[0.98] transition-transform hover:border-blue-300 hover:shadow-md text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
            {event.description}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{locationText}</span>
          </div>
        </div>
        <span
          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
            event.status
          )}`}
        >
          {event.status}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm">
          <div className={`font-semibold ${priorityInfo.color}`}>
            {priorityInfo.text}
          </div>
          <div className="text-gray-500">
            {formatDate(event.create_time)}
          </div>
        </div>
        
        {/* Volunteer count badge */}
        {event.activeVolunteers !== undefined && (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{event.activeVolunteers} helping</span>
          </div>
        )}
      </div>
    </button>
  )
}
