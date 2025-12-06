"use client";

import { useState } from "react";
import { useResourcesAvailable } from "@/hooks/use-resources-available";
import { useResourcesNeeded } from "@/hooks/use-resources-needed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  CheckCircle,
  XCircle,
  Search,
  TrendingUp,
  TrendingDown,
  User,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddResourceDialog } from "@/components/dialogs/add-resource-dialog";
import { AllocateResourceDialog } from "@/components/dialogs/allocate-resource-dialog";
import { AssignResourceDialog } from "@/components/dialogs/assign-resource-dialog";
import { useUsers } from "@/hooks/use-users";
import { useEvents } from "@/hooks/use-events";

export function ResourcesList() {
  const { data: resourcesAvailable, isLoading: isLoadingAvailable } =
    useResourcesAvailable();
  const { data: resourcesNeeded, isLoading: isLoadingNeeded } =
    useResourcesNeeded();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { data: events } = useEvents();
  const { data: users } = useUsers();

  const available = resourcesAvailable || [];
  const needed = resourcesNeeded || [];

  const filteredAvailable = available.filter((resource: any) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNeeded = needed.filter((resource: any) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingAvailable || isLoadingNeeded) {
    return (
      <div className="text-center text-muted-foreground">
        Loading resources...
      </div>
    );
  }

  if (!resourcesAvailable || !resourcesNeeded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          Failed to load resources
        </div>
      </div>
    );
  }

  const handleAllocate = (resource: any) => {
    setSelectedResource(resource);
    setIsAllocateDialogOpen(true);
  };

  const handleAssign = (resource: any) => {
    setSelectedResource(resource);
    setIsAssignDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4" />
        </Button> */}
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="available" className="flex-1">
            Available ({filteredAvailable.length})
          </TabsTrigger>
          <TabsTrigger value="needed" className="flex-1">
            Needed ({filteredNeeded.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-3">
          {filteredAvailable.length === 0 ? (
            <div className="text-center text-muted-foreground">
              {searchQuery
                ? "No resources match your search"
                : "No resources available"}
            </div>
          ) : (
            filteredAvailable.map((resource: any) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-chart-2/20">
                    <Package className="h-5 w-5 text-chart-2" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">
                        {resource.name}
                      </h3>
                      <CheckCircle className="h-4 w-4 text-chart-2" />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>

                    {(() => {
                      if (resource.event_id) {
                        const allocatedEvent = events?.find(
                          (e: any) => e.id === resource.event_id
                        );
                        return allocatedEvent ? (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              <span className="mr-1">Allocated to Event:</span>
                              <span className="font-medium text-foreground">
                                {allocatedEvent.description}
                              </span>
                            </span>
                          </div>
                        ) : null;
                      } else if (resource.volunteer_id) {
                        const allocatedUser = users?.find(
                          (u: any) => u.id === resource.volunteer_id
                        );
                        return allocatedUser ? (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              <span className="mr-1">Allocated to:</span>
                              <span className="font-medium text-foreground">
                                {allocatedUser.name}
                              </span>
                              {allocatedUser.phonenumber && (
                                <span className="ml-1 text-muted-foreground">
                                  ({allocatedUser.phonenumber})
                                </span>
                              )}
                            </span>
                          </div>
                        ) : null;
                      }
                      return null;
                    })()}

                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-xs"
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Qty: {resource.quantity}
                      </Badge>
                      <Badge variant="outline" className="px-2 py-0.5 text-xs">
                        {resource.resource_type}
                      </Badge>
                      {resource.location && (
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 text-xs"
                        >
                          {resource.location}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAssign(resource)}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="needed" className="space-y-3">
          {filteredNeeded.length === 0 ? (
            <div className="text-center text-muted-foreground">
              {searchQuery
                ? "No resources match your search"
                : "No resources needed"}
            </div>
          ) : (
            filteredNeeded.map((resource: any) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/20">
                    <Package className="h-5 w-5 text-chart-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {resource.name}
                      </h3>
                      <XCircle className="h-4 w-4 text-chart-5" />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {resource.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="destructive">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        Needed: {resource.quantity}
                      </Badge>
                      <Badge variant="outline">{resource.resource_type}</Badge>
                      {resource.event_id && (
                        <Badge variant="outline" className="text-xs">
                          Event #{resource.event_id}
                        </Badge>
                      )}
                    </div>

                    {resource.is_fulfilled && (
                      <div className="mt-2">
                        <Badge variant="default" className="text-xs">
                          Fulfilled
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AddResourceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
      <AllocateResourceDialog
        open={isAllocateDialogOpen}
        onOpenChange={setIsAllocateDialogOpen}
        resource={selectedResource}
      />
      <AssignResourceDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        resource={selectedResource}
      />
    </div>
  );
}
