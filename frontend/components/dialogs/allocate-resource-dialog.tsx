"use client"

import type React from "react"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
import { api } from "@/lib/api-client"
import { formatAddress } from "@/lib/utils"

interface AllocateResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: any
}

export function AllocateResourceDialog({ open, onOpenChange, resource }: AllocateResourceDialogProps) {
  const { toast } = useToast()
  const { data: events } = useEvents()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resource) return
    setIsSubmitting(true)

    try {
      await api.put(`/resources/available/${resource.id}`, {
        event_id: Number.parseInt(selectedEventId, 10),
        is_allocated: true,
        status: "in_use",
      })

      toast({
        title: "Resource allocated",
        description: `${resource.name} has been allocated to the event.`,
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resources/available"] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
      ])

      setSelectedEventId("")
      setQuantity("1")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to allocate resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!resource) return null

  const activeEvents = events?.filter((e: any) => e.status === "active" || e.status === "pending") || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Allocate Resource</DialogTitle>
          <DialogDescription>Assign {resource.name} to an emergency event.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">{resource.name}</h4>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
              <p className="mt-2 text-sm text-foreground">Available: {resource.quantity}</p>
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
                      <SelectItem key={event.id} value={String(event.id)}>
                        {event.description} - {formatAddress(event.location)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              Full resource allocation only. Partial allocations will be enabled in a future update.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedEventId}>
              {isSubmitting ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
