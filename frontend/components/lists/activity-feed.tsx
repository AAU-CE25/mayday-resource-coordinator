"use client"

import { useActivity } from "@/hooks/use-activity"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, AlertCircle, Package, User } from "lucide-react"

export function ActivityFeed() {
  const { data: activities, isLoading } = useActivity()

  const getIcon = (type: string) => {
    switch (type) {
      case "event":
        return <AlertCircle className="h-4 w-4 text-chart-5" />
      case "resource":
        return <Package className="h-4 w-4 text-chart-2" />
      case "volunteer":
        return <User className="h-4 w-4 text-chart-1" />
      default:
        return <Activity className="h-4 w-4 text-chart-3" />
    }
  }

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">Loading activity...</div>
  }

  if (!activities || activities.length === 0) {
    return <div className="text-center text-sm text-muted-foreground">No recent activity</div>
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {activities.map((activity: any) => (
          <Card key={activity.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-secondary p-2">{getIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
