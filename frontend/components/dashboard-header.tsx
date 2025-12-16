"use client"

import * as React from "react"
import { Activity, AlertTriangle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationsPopover } from "./notifications-popover"
import { useNotifications } from "@/hooks/use-notifications"

export function Header() {
  const { unreadCount, isLoading } = useNotifications()

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <AlertTriangle className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Emergency Coordination</h1>
          <p className="text-sm text-muted-foreground">Resource Management System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <Activity className={`h-4 w-4 ${!isLoading ? "animate-pulse" : ""} text-chart-2`} />
          <span className="text-sm font-medium text-foreground">{!isLoading ? "System Active" : "Connecting..."}</span>
        </div>

        <NotificationsPopover>
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </NotificationsPopover>
      </div>
    </header>
  )
}
