"use client"

import { Activity, AlertTriangle, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export function Header() {
  const { user, logout } = useAuth()

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
          <Activity className="h-4 w-4 animate-pulse text-chart-2" />
          <span className="text-sm font-medium text-foreground">System Active</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 border-l pl-3">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                {user.role && (
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
