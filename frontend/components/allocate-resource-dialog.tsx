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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useEvents } from "@/hooks/use-events"
import { mutate } from "swr"

interface AllocateResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: any
}

export function AllocateResourceDialog({ open, onOpenChange, resource }: AllocateResourceDialogProps) {
  const { toast } = useToast()
  const { data: events } = useEvents()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState("")
  const [quantity, setQuantity] = useState("1")

  useEffect(() => {
    if (resource) {
      setQuantity("1")
    }
  }, [resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/resources/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: resource.id,
          event_id: selectedEventId,
          quantity: Number.parseInt(quantity),
        }),
      })

      if (response.ok) {
        toast({
          title: "Resource allocated",
          description: `${resource.name} has been allocated to the event.`,
        })

        mutate("/api/resources")
        mutate("/api/event")

        setSelectedEventId("")
        setQuantity("1")
        onOpenChange(false)
      } else {
        throw new Error("Failed to allocate resource")
      }
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
                      <SelectItem key={event.id} value={event.id}>
                        {event.description} - {event.location.address}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Allocate</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={resource.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
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
