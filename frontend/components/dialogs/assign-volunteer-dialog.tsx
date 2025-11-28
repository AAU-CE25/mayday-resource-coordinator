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
import { useEvents } from "@/hooks/use-events";
import { useCreateVolunteer } from "@/hooks/use-volunteer-mutations";
import type { UserResponse } from "@/lib/types";

interface AssignVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: UserResponse | null;  // This is actually a User being assigned to an event
}

export function AssignVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
}: AssignVolunteerDialogProps) {
  const { data: events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState("");

  const resetAndClose = () => {
    setSelectedEventId("");
    onOpenChange(false);
  };

  const createVolunteer = useCreateVolunteer({ onSuccess: resetAndClose });

  useEffect(() => {
    if (open) {
      setSelectedEventId("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteer || !selectedEventId) return;

    // Create a new Volunteer record linking the user to the event
    createVolunteer.mutate({
      user_id: volunteer.id,
      event_id: parseInt(selectedEventId),
      status: "active",
    });
  };

  if (!volunteer) return null;

  const activeEvents =
    events?.filter(
      (e: any) => e.status === "active" || e.status === "pending"
    ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign User to Event</DialogTitle>
          <DialogDescription>
            Assign {volunteer.name} to an emergency event as a volunteer.
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
              {volunteer.email && (
                <p className="text-sm text-muted-foreground">
                  {volunteer.email}
                </p>
              )}
            </div>

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
            <Button type="submit" disabled={createVolunteer.isPending || !selectedEventId}>
              {createVolunteer.isPending ? "Assigning..." : "Assign to Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
