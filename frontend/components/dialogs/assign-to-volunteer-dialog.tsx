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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";

interface AssignToVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: any;
}

export function AssignToVolunteerDialog({
  open,
  onOpenChange,
  resource,
}: AssignToVolunteerDialogProps) {
  const { toast } = useToast();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (resource?.volunteer_id) {
      setSelectedVolunteerId(String(resource.volunteer_id));
    } else {
      setSelectedVolunteerId("");
    }
  }, [resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    setIsSubmitting(true);
    try {
      const endpoint = `/resources/available/${resource.id}`;
      const payload: any = {
        volunteer_id: Number.parseInt(selectedVolunteerId),
      };
      const updated = await api.put(endpoint, payload);
      toast({
        title: "Resource assigned",
        description: `${resource.name} assigned to volunteer.`,
      });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign to Volunteer</DialogTitle>
          <DialogDescription>
            Select a volunteer to own this resource.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-secondary p-4">
              <h4 className="font-semibold text-foreground">{resource.name}</h4>
              <p className="text-sm text-muted-foreground">
                {resource.description}
              </p>
            </div>
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
              disabled={isSubmitting || !selectedVolunteerId}
            >
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
