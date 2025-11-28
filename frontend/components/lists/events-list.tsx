"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/hooks/use-events";
import { useVolunteers } from "@/hooks/use-volunteers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, AlertCircle, Plus, Search, Filter } from "lucide-react";
import { CreateEventDialog } from "@/components/dialogs/create-event-dialog";
import AssignToEventDialog from "@/components/dialogs/assign-to-event-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAddress } from "@/lib/utils";

interface EventsListProps {
  selectedEvent: string | null;
  onEventSelect?: (eventId: string | null) => void;
}

export function EventsList({ selectedEvent, onEventSelect }: EventsListProps) {
  const { data: events, isLoading } = useEvents();
  const { data: volunteers } = useVolunteers();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignEvent, setAssignEvent] = useState<any | null>(null);

  const filteredEvents = events?.filter((event: any) => {
    const locStr = formatAddress(event.location).toLowerCase();
    const matchesSearch =
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locStr.includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || event.priority.toString() === priorityFilter;
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // listen for popup requests from map markers
  useEffect(() => {
    function handler(e: any) {
      console.log("Received openAssignToEvent event:", e?.detail);
      const eventId = e?.detail;
      if (!eventId) return;
      const evt = events?.find((ev: any) => ev.id === eventId);
      console.log("Found event:", evt);
      if (evt) {
        setAssignEvent(evt);
        setAssignDialogOpen(true);
      }
    }
    window.addEventListener("openAssignToEvent", handler);
    console.log("Added openAssignToEvent listener");
    return () => {
      window.removeEventListener("openAssignToEvent", handler);
      console.log("Removed openAssignToEvent listener");
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">Loading events...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
          </Button> */}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="1">Priority 1</SelectItem>
              <SelectItem value="2">Priority 2</SelectItem>
              <SelectItem value="3">Priority 3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filteredEvents || filteredEvents.length === 0 ? (
        <div className="text-center text-muted-foreground">
          {searchQuery || priorityFilter !== "all" || statusFilter !== "all"
            ? "No events match your filters"
            : "No active events"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event: any) => (
            <Card
              key={event.id}
              className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                selectedEvent === event.id
                  ? "border-primary bg-secondary ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => onEventSelect?.(event.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-chart-5" />
                    <h3 className="font-semibold text-foreground">
                      {event.description}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignEvent(event);
                        setAssignDialogOpen(true);
                      }}
                      className="ml-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location.address.street}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        event.priority === 1
                          ? "destructive"
                          : event.priority === 2
                          ? "default"
                          : "secondary"
                      }
                    >
                      Priority {event.priority}
                    </Badge>
                    <Badge
                      variant={
                        event.status === "active"
                          ? "destructive"
                          : event.status === "pending"
                          ? "default"
                          : "outline"
                      }
                    >
                      {event.status}
                    </Badge>
                    <Badge variant="outline">
                      {volunteers
                        ? volunteers.filter(
                            (v: any) =>
                              (v.event_id ?? v.assigned_event) === event.id
                          ).length
                        : 0}{" "}
                      Volunteers
                    </Badge>
                  </div>

                  {event.resources_needed &&
                    event.resources_needed.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Resources Needed:
                        </p>
                        {event.resources_needed.map(
                          (resource: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-foreground">
                                {resource.name} ({resource.quantity})
                              </span>
                              <Badge
                                variant={
                                  resource.is_fulfilled
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {resource.is_fulfilled ? "Fulfilled" : "Needed"}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <AssignToEventDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        event={assignEvent}
      />
    </div>
  );
}

// add default export so both named and default imports work
export default EventsList;
