"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/hooks/use-events";
import { mutate } from "swr";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

interface AssignVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: any;
}

export function AssignVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
}: AssignVolunteerDialogProps) {
  const { toast } = useToast();
  const { data: events } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedEventId("");
    }
  }, [open]);

  const handleUnassign = async () => {
    setIsSubmitting(true);

    try {
      await api.put(`/volunteers/${volunteer.id}`, {
        id: volunteer.id,
        event_id: null,
      });

      toast({
        title: "Volunteer unassigned",
        description: `${volunteer.name} has been removed from the event.`,
      });

      mutate("volunteers");
      mutate("events");

      onOpenChange(false);
    } catch (error) {
      console.error("Unassignment error:", error);
      toast({
        title: "Error",
        description: "Failed to unassign volunteer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update the volunteer's event assignment
      await api.put(`/volunteers/${volunteer.id}`, {
        id: volunteer.id,
        event_id: parseInt(selectedEventId),
      });

      toast({
        title: "Volunteer assigned",
        description: `${volunteer.name} has been assigned to the event.`,
      });

      mutate("volunteers");
      mutate("events");

      setSelectedEventId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast({
        title: "Error",
        description: "Failed to assign volunteer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!volunteer) return null;

  const activeEvents =
    events?.filter(
      (e: any) => e.status === "active" || e.status === "pending"
    ) || [];
  const currentEvent = volunteer.event_id
    ? events?.find((e: any) => e.id === volunteer.event_id)
    : null;
  const isAssigned = volunteer.event_id !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Volunteer</DialogTitle>
          <DialogDescription>
            Assign {volunteer.name} to an emergency event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">
                {volunteer.name}
              </h4>
              {volunteer.phonenumber && (
                <p className="text-sm text-muted-foreground">
                  {volunteer.phonenumber}
                </p>
              )}
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

            {isAssigned && currentEvent && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Currently assigned:
                    </p>
                    <p className="mt-1 font-semibold text-orange-950 dark:text-orange-50">
                      {currentEvent.description}
                    </p>
                    {currentEvent.location?.address?.street && (
                      <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300">
                        {currentEvent.location.address.street}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleUnassign}
                    disabled={isSubmitting}
                  >
                    Unassign
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="event">Select Event</Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
                required
              >
                <SelectTrigger id="event">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No active events
                    </div>
                  ) : (
                    activeEvents.map((event: any) => (
                      <SelectItem key={event.id} value={String(event.id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {event.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.location?.address?.street || ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedEventId}>
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
