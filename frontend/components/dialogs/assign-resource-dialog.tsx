"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { api } from "@/lib/api-client";
import { formatAddress } from "@/lib/utils";
import { useEvents } from "@/hooks/use-events";

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: any;
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  resource,
}: AssignResourceDialogProps) {
  const { toast } = useToast();
  const { data: events } = useEvents();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"event" | "volunteer">("event");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("event");
      setSelectedEventId("");
      setSelectedVolunteerId("");
    }
  }, [open]);

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const data = await api.get("/volunteers/");
        setVolunteers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load volunteers", err);
      }
    };
    if (open) loadVolunteers();
  }, [open]);

  const activeEvents =
    events?.filter(
      (e: any) => e.status === "active" || e.status === "pending"
    ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    setIsSubmitting(true);
    try {
      const endpoint = `/resources/available/${resource.id}`;
      if (mode === "event") {
        await api.put(endpoint, {
          event_id: Number.parseInt(selectedEventId, 10),
          is_allocated: true,
          status: "in_use",
        });
        toast({
          title: "Resource allocated",
          description: `${resource.name} allocated to event.`,
        });
      } else {
        await api.put(endpoint, {
          volunteer_id: Number.parseInt(selectedVolunteerId, 10),
          event_id: null,
          is_allocated: false,
        });
        toast({
          title: "Resource assigned",
          description: `${resource.name} assigned to volunteer.`,
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resources/available"] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
      ]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to assign resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign Resource</DialogTitle>
          <DialogDescription>
            Select whether to assign to an event or volunteer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">{resource.name}</h4>
              <p className="text-sm text-muted-foreground">
                {resource.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Assign Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "event" ? "default" : "outline"}
                  onClick={() => setMode("event")}
                >
                  Event
                </Button>
                <Button
                  type="button"
                  variant={mode === "volunteer" ? "default" : "outline"}
                  onClick={() => setMode("volunteer")}
                >
                  Volunteer
                </Button>
              </div>
            </div>

            {mode === "event" ? (
              <div className="space-y-3">
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
                            {event.description} -{" "}
                            {formatAddress(event.location)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full resource allocation only. Partial allocations are not yet supported.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="volunteer">Select Volunteer</Label>
                  <Select
                    value={selectedVolunteerId}
                    onValueChange={setSelectedVolunteerId}
                    required
                  >
                    <SelectTrigger id="volunteer">
                      <SelectValue placeholder="Choose a volunteer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No volunteers found
                        </div>
                      ) : (
                        volunteers.map((v: any) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} {v.phonenumber ? `(${v.phonenumber})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
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
                (mode === "event" ? !selectedEventId : !selectedVolunteerId)
              }
            >
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
