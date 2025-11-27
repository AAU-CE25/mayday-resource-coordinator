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
      // try assign endpoint first, fall back to creating a volunteer assignment
      await api.post("/volunteers/assign", {
        volunteer_id: selectedVolunteerId,
        event_id: event.id,
      })

      toast({
        title: "Volunteer assigned",
        description: `Volunteer has been assigned to ${event.description}`,
      })

      mutate("volunteers")
      mutate("events")

      setSelectedVolunteerId("")
      onOpenChange(false)

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

  if (!event) return null

  const availableVolunteers = volunteers?.filter((v: any) => v.availability === "available") || []

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
                  {availableVolunteers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No available volunteers</div>
                  ) : (
                    availableVolunteers.map((vol: any) => (
                      <SelectItem key={vol.id} value={String(vol.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">{vol.user?.name || vol.user}</span>
                          <span className="text-xs text-muted-foreground">{vol.phonenumber}</span>
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
            <Button type="submit" disabled={isSubmitting || !selectedVolunteerId}>
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignToEventDialog
