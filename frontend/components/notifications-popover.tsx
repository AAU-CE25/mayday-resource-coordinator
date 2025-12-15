"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "@/hooks/use-notifications"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationsPopoverProps {
  children: React.ReactNode
}

export function NotificationsPopover({ children }: NotificationsPopoverProps) {
  const { data: notifications, isLoading, markAsRead, markAllAsRead } = useNotifications()
  const { toast } = useToast()

  const handleMarkRead = (notificationId: number) => {
    markAsRead(notificationId)
    toast({
      title: "Marked as read",
      description: "Notification removed from list.",
    })
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    toast({
      title: "All marked as read",
      description: "All notifications cleared.",
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-chart-2" />
      case "error":
        return <XCircle className="h-4 w-4 text-chart-5" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-chart-4" />
      default:
        return <Info className="h-4 w-4 text-chart-1" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {notifications && notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="space-y-2 p-2">
              {notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className="group cursor-pointer p-3 transition-colors hover:bg-secondary border-primary bg-secondary/50"
                  onClick={() => handleMarkRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon("info")}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <Badge variant="default" className="h-5 text-xs">
                          New
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}