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
import { useUsers } from "@/hooks/use-users";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

interface AssignToEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
}

export function AssignToEventDialog({
  open,
  onOpenChange,
  event,
}: AssignToEventDialogProps) {
  const { toast } = useToast();
  const { data: users } = useUsers();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedUserId("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedUser = users?.find(
        (u: any) => String(u.id) === selectedUserId
      );

      // Check if there's an active volunteer record for this user/event
      const volunteerQuery = await api.get(
        `/volunteers?user_id=${selectedUserId}&event_id=${event.id}&status=active`
      );
      const existingVolunteers = Array.isArray(volunteerQuery)
        ? volunteerQuery
        : [];

      if (existingVolunteers.length > 0) {
        // Unassign: mark volunteer as completed for this user/event
        for (const vol of existingVolunteers) {
          await api.put(`/volunteers/${vol.id}`, {
            id: vol.id,
            status: "completed",
          });
        }

        toast({
          title: "User removed from event",
          description: `User is no longer volunteering for ${event.description}`,
        });
      } else {
        // Assign: create a volunteer record linking this user to the event
        await api.post(`/volunteers`, {
          user_id: parseInt(selectedUserId),
          event_id: event.id,
        });

        toast({
          title: "User assigned as volunteer",
          description: `User is now volunteering for ${event.description}`,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });

      setSelectedUserId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user assignment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  // Show ALL users
  const allUsers = users || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign User to Event</DialogTitle>
          <DialogDescription>
            Assign a user as a volunteer to {event.description}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">
                {event.description}
              </h4>
              <p className="text-sm text-muted-foreground">
                {event.location?.address?.street || ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                required
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No users registered
                    </div>
                  ) : (
                    allUsers.map((user: any) => {
                      const isVolunteerHere =
                        user.event_id === event.id ||
                        user.assigned_event === event.id;
                      const isVolunteerElsewhere =
                        !isVolunteerHere &&
                        (user.event_id ||
                          user.assigned_event ||
                          user.status === "assigned");
                      return (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.phonenumber}
                              </span>
                            </div>
                            {isVolunteerHere && (
                              <Badge variant="default" className="text-xs">
                                Volunteering Here
                              </Badge>
                            )}
                            {isVolunteerElsewhere && (
                              <Badge variant="secondary" className="text-xs">
                                {user.event_id || user.assigned_event
                                  ? `Volunteering Event #${
                                      user.event_id || user.assigned_event
                                    }`
                                  : `Volunteering (assigned)`}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
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
            <Button type="submit" disabled={isSubmitting || !selectedUserId}>
              {isSubmitting
                ? "Updating..."
                : selectedUserId &&
                  users?.find((u: any) => String(u.id) === selectedUserId)
                    ?.status === "assigned"
                ? "Unassign from Event"
                : "Assign as Volunteer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignToEventDialog;
