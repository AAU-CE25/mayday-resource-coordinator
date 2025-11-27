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
import { useVolunteers } from "@/hooks/use-volunteers"
import { mutate } from "swr"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"

interface AssignToEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any
}

export function AssignToEventDialog({ open, onOpenChange, event }: AssignToEventDialogProps) {
  const { toast } = useToast()
  const { data: volunteers } = useVolunteers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("")

  useEffect(() => {
    if (open) {
      setSelectedVolunteerId("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const selectedVol = volunteers?.find((v: any) => String(v.id) === selectedVolunteerId)
      const isAssignedToThisEvent = selectedVol && (selectedVol.event_id === event.id || selectedVol.assigned_event === event.id)

      if (isAssignedToThisEvent) {
        // Unassign: Clear event_id to make volunteer available again
        await api.put(`/volunteers/${selectedVolunteerId}`, {
          id: parseInt(selectedVolunteerId),
          event_id: null
        })

        toast({
          title: "Volunteer unassigned",
          description: `Volunteer has been removed from ${event.description}`,
        })
      } else {
        // Assign: Update volunteer's event_id
        await api.put(`/volunteers/${selectedVolunteerId}`, {
          id: parseInt(selectedVolunteerId),
          event_id: event.id
        })

        toast({
          title: "Volunteer assigned",
          description: `Volunteer has been assigned to ${event.description}`,
        })
      }

      mutate("volunteers")
      mutate("events")

      setSelectedVolunteerId("")
      onOpenChange(false)

    } catch (error) {
      console.error("Error updating volunteer assignment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update volunteer assignment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) return null

  // Show ALL volunteers, not just available
  const allVolunteers = volunteers || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Volunteer to Event</DialogTitle>
          <DialogDescription>Assign a volunteer to {event.description}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">{event.description}</h4>
              <p className="text-sm text-muted-foreground">{event.location?.address?.street || ""}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volunteer">Select Volunteer</Label>
              <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId} required>
                <SelectTrigger id="volunteer">
                  <SelectValue placeholder="Choose a volunteer..." />
                </SelectTrigger>
                <SelectContent>
                  {allVolunteers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No volunteers registered</div>
                  ) : (
                    allVolunteers.map((vol: any) => {
                      const isAssignedHere = vol.event_id === event.id || vol.assigned_event === event.id
                      const isAssignedElsewhere = !isAssignedHere && (vol.event_id || vol.assigned_event)
                      return (
                        <SelectItem key={vol.id} value={String(vol.id)}>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{vol.name}</span>
                              <span className="text-xs text-muted-foreground">{vol.phonenumber}</span>
                            </div>
                            {isAssignedHere && (
                              <Badge variant="default" className="text-xs">Assigned Here</Badge>
                            )}
                            {isAssignedElsewhere && (
                              <Badge variant="secondary" className="text-xs">Assigned Event #{vol.event_id || vol.assigned_event}</Badge>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedVolunteerId}>
              {isSubmitting ? "Updating..." : (
                allVolunteers.find((v: any) => String(v.id) === selectedVolunteerId && (v.event_id === event.id || v.assigned_event === event.id))
                  ? "Remove from Event"
                  : "Assign to Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignToEventDialog
