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
import { useUpdateVolunteer } from "@/hooks/use-volunteer-mutations";
import type { UserResponse } from "@/lib/types";
import { api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

interface AssignVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: UserResponse | null; // This is actually a User being assigned to an event
}

export function AssignVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
}: AssignVolunteerDialogProps) {
  const { data: events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteer) return;

    // If user is already assigned, unassign them
    if (volunteer.status === "assigned") {
      setIsSubmitting(true);
      try {
        // Find active volunteers for this user
        const volunteerQuery = await api.get(
          `/volunteers?user_id=${volunteer.id}&status=active`
        );
        const existingVolunteers = Array.isArray(volunteerQuery)
          ? volunteerQuery
          : [];

        // Mark all active volunteers as completed
        for (const vol of existingVolunteers) {
          await api.put(`/volunteers/${vol.id}`, {
            id: vol.id,
            status: "completed",
          });
        }

        // Invalidate queries and close
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["volunteers"] });
        resetAndClose();
      } catch (error) {
        console.error("Error unassigning user:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // User is available, show event selection dialog
      if (!selectedEventId) return;
      // Create a new Volunteer record linking the user to the event
      createVolunteer.mutate({
        user_id: volunteer.id,
        event_id: parseInt(selectedEventId),
        status: "active",
      });
    }
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
          <DialogTitle>
            {volunteer?.status === "assigned"
              ? "Unassign User from Event"
              : "Assign User to Event"}
          </DialogTitle>
          <DialogDescription>
            {volunteer?.status === "assigned"
              ? `${volunteer.name} will be unassigned from their current event.`
              : `Assign ${volunteer?.name} to an emergency event as a volunteer.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">
                {volunteer?.name}
              </h4>
              {volunteer?.phonenumber && (
                <p className="text-sm text-muted-foreground">
                  {volunteer.phonenumber}
                </p>
              )}
              {volunteer?.email && (
                <p className="text-sm text-muted-foreground">
                  {volunteer.email}
                </p>
              )}
            </div>

            {volunteer?.status !== "assigned" && (
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
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createVolunteer.isPending ||
                (volunteer?.status !== "assigned" && !selectedEventId)
              }
            >
              {isSubmitting || createVolunteer.isPending
                ? "Updating..."
                : volunteer?.status === "assigned"
                ? "Unassign from Event"
                : "Assign to Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
