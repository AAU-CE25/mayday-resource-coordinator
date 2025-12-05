"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function LiveStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Update timestamp every 5 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 5000)

    setIsMounted(true)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="gap-1">
          <Wifi className="h-3 w-3" />
          Live
        </Badge>
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? "Live" : "Offline"}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Updated {lastUpdate?.toLocaleTimeString()}
      </span>
    </div>
  )
}
