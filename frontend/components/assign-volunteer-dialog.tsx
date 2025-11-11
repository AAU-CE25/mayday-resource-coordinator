"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useEvents } from "@/hooks/use-events"
import { mutate } from "swr"
import { Badge } from "@/components/ui/badge"

interface AssignVolunteerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteer: any
}

export function AssignVolunteerDialog({ open, onOpenChange, volunteer }: AssignVolunteerDialogProps) {
  const { toast } = useToast()
  const { data: events } = useEvents()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState("")

  useEffect(() => {
    if (open) {
      setSelectedEventId("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/volunteers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteer_id: volunteer.id,
          event_id: selectedEventId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Volunteer assigned",
          description: `${volunteer.name} has been assigned to the event.`,
        })

        mutate("volunteers")
        mutate("events")

        setSelectedEventId("")
        onOpenChange(false)
      } else {
        throw new Error("Failed to assign volunteer")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign volunteer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!volunteer) return null

  const activeEvents = events?.filter((e: any) => e.status === "active" || e.status === "pending") || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Volunteer</DialogTitle>
          <DialogDescription>Assign {volunteer.name} to an emergency event.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">{volunteer.name}</h4>
              {volunteer.phone && <p className="text-sm text-muted-foreground">{volunteer.phone}</p>}
              {volunteer.skills && volunteer.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {volunteer.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Select Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId} required>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No active events</div>
                  ) : (
                    activeEvents.map((event: any) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.description}</span>
                          <span className="text-xs text-muted-foreground">{event.location.address}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedEventId}>
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
