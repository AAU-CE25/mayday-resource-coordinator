"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
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
import { AddUserDialog } from "@/components/dialogs/add-user-dialog";
import { AssignVolunteerDialog } from "@/components/dialogs/assign-volunteer-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UserList() {
  const { data: users, isLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = users?.filter((user: any) => {
    const nameMatch = user.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const phoneMatch = user.phonenumber
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch;

    // Determine actual status using the canonical `user.status` when available.
    // Fall back to legacy `event_id` check only if `status` is missing.
    const isAssigned =
      user.status === "assigned" ||
      (user.status === undefined && user.event_id != null);

    // Check user.status field for unavailable
    let actualStatus: string;
    if (user.status === "unavailable") {
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
      <div className="text-center text-muted-foreground">Loading users...</div>
    );
  }

  const handleAssign = (user: any) => {
    setSelectedUser(user);
    setIsAssignDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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

      {!filteredUsers || filteredUsers.length === 0 ? (
        <div className="text-center text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? "No users match your filters"
            : "No users registered"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user: any) => {
            // Determine status based on canonical user.status (fall back to event_id)
            const isAssigned =
              user.status === "assigned" ||
              (user.status === undefined && user.event_id != null);
            const isUnavailable = user.status === "unavailable";

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
              <Card key={user.id} className="p-4">
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
                          {user.name}
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAssign(user)}
                          className="ml-2"
                          aria-label={`Assign ${user.name} to event`}
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

                    {user.phonenumber && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{user.phonenumber}</span>
                      </div>
                    )}

                    {user.location && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {user.location.address || "Location available"}
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
                      {user.skills &&
                        user.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                    </div>

                    {isAssigned && user.event_id && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Assigned to Event #{user.event_id}
                        </Badge>
                      </div>
                    )}

                    {!isAssigned && !isUnavailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full bg-transparent"
                        onClick={() => handleAssign(user)}
                      >
                        Assign to Event
                      </Button>
                    )}

                    {isAssigned && !isUnavailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full bg-transparent"
                        onClick={() => handleAssign(user)}
                      >
                        Unassign from Event
                      </Button>
                    )}

                    {isUnavailable && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                        <p className="text-xs text-red-600 font-medium">
                          User marked as unavailable
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

      <AddUserDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <AssignVolunteerDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        volunteer={selectedUser}
      />
    </div>
  );
}
