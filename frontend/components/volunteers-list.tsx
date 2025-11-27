"use client";

import { useState } from "react";
import { useVolunteers } from "@/hooks/use-volunteers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Phone,
  MapPin,
  Plus,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { AddVolunteerDialog } from "./add-volunteer-dialog";
import { AssignVolunteerDialog } from "./assign-volunteer-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VolunteersList() {
  const { data: volunteers, isLoading } = useVolunteers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);

  const filteredVolunteers = volunteers?.filter((volunteer: any) => {
    const matchesSearch =
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.phonenumber.toLowerCase().includes(searchQuery.toLowerCase());

    // Determine actual status
    const isAssigned =
      volunteer.event_id !== null && volunteer.event_id !== undefined;

    // Check volunteer.status field for unavailable
    let actualStatus: string;
    if (volunteer.status === "unavailable") {
      actualStatus = "unavailable";
    } else if (isAssigned) {
      actualStatus = "assigned";
    } else {
      actualStatus = "available";
    }

    const matchesStatus =
      statusFilter === "all" || actualStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading volunteers...
      </div>
    );
  }

  const handleAssign = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsAssignDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
          </Button> */}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filteredVolunteers || filteredVolunteers.length === 0 ? (
        <div className="text-center text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? "No volunteers match your filters"
            : "No volunteers registered"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVolunteers.map((volunteer: any) => {
            // Determine status based on volunteer.status and event_id
            const isAssigned =
              volunteer.event_id !== null && volunteer.event_id !== undefined;
            const isUnavailable = volunteer.status === "unavailable";

            // Determine colors based on status
            let bgColor: string;
            let textColor: string;
            let icon: React.ReactNode;

            if (isUnavailable) {
              bgColor = "bg-red-500/20";
              textColor = "text-red-500";
              icon = <UserX className={`h-5 w-5 ${textColor}`} />;
            } else if (isAssigned) {
              bgColor = "bg-orange-500/20";
              textColor = "text-orange-500";
              icon = <User className={`h-5 w-5 ${textColor}`} />;
            } else {
              bgColor = "bg-green-500/20";
              textColor = "text-green-500";
              icon = <User className={`h-5 w-5 ${textColor}`} />;
            }

            return (
              <Card key={volunteer.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}
                  >
                    {icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {volunteer.name}
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAssign(volunteer)}
                          className="ml-2"
                          aria-label={`Assign ${volunteer.name} to event`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {isUnavailable ? (
                        <UserX className="h-4 w-4 text-red-500" />
                      ) : isAssigned ? (
                        <UserCheck className="h-4 w-4 text-orange-500" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    {volunteer.phonenumber && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{volunteer.phonenumber}</span>
                      </div>
                    )}

                    {volunteer.location && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {volunteer.location.address || "Location available"}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isUnavailable
                            ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                            : isAssigned
                            ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                            : "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                        }
                      >
                        {isUnavailable
                          ? "Unavailable"
                          : isAssigned
                          ? "Assigned (Busy)"
                          : "Available"}
                      </Badge>
                      {volunteer.skills &&
                        volunteer.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                    </div>

                    {isAssigned && volunteer.event_id && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Assigned to Event #{volunteer.event_id}
                        </Badge>
                      </div>
                    )}

                    {!isAssigned && !isUnavailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full bg-transparent"
                        onClick={() => handleAssign(volunteer)}
                      >
                        Assign to Event
                      </Button>
                    )}

                    {isUnavailable && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                        <p className="text-xs text-red-600 font-medium">
                          Volunteer marked as unavailable
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddVolunteerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
      <AssignVolunteerDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        volunteer={selectedVolunteer}
      />
    </div>
  );
}
