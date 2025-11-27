"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  const [mode, setMode] = useState<"event" | "volunteer">("event");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [quantity, setQuantity] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("event");
      setSelectedEventId("");
      setSelectedVolunteerId("");
      setQuantity("1");
    }
  }, [open]);

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const data = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/volunteers/`
        );
        if (!data.ok) throw new Error("Failed to fetch volunteers");
        const json = await data.json();
        setVolunteers(Array.isArray(json) ? json : []);
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
      if (mode === "event") {
        const response = await fetch("/api/resources/allocate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource_id: resource.id,
            event_id: selectedEventId,
            quantity: Number.parseInt(quantity),
          }),
        });
        if (!response.ok) throw new Error("Failed to allocate resource");
        toast({
          title: "Resource allocated",
          description: `${resource.name} allocated to event.`,
        });
      } else {
        const endpoint = `/resources/available/${resource.id}`;
        const payload: any = {
          volunteer_id: Number.parseInt(selectedVolunteerId),
        };
        await api.put(endpoint, payload);
        toast({
          title: "Resource assigned",
          description: `${resource.name} assigned to volunteer.`,
        });
      }
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
