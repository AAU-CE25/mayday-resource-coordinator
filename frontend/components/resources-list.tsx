"use client"

import { useState } from "react"
import { useResourcesAvailable } from "@/hooks/use-resources-available"
import { useResourcesNeeded } from "@/hooks/use-resources-needed"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, CheckCircle, XCircle, Plus, Search, TrendingUp, TrendingDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddResourceDialog } from "./add-resource-dialog"
import { AllocateResourceDialog } from "./allocate-resource-dialog"

export function ResourcesList() {
  const { data: resourcesAvailable, isLoading: isLoadingAvailable } = useResourcesAvailable()
  const { data: resourcesNeeded, isLoading: isLoadingNeeded } = useResourcesNeeded()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<any>(null)

  const available = resourcesAvailable || []
  const needed = resourcesNeeded || []

  const filteredAvailable = available.filter((resource: any) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredNeeded = needed.filter((resource: any) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoadingAvailable || isLoadingNeeded) {
    return <div className="text-center text-muted-foreground">Loading resources...</div>
  }

  if (!resourcesAvailable || !resourcesNeeded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">Failed to load resources</div>
      </div>
    )
  }

  const handleAllocate = (resource: any) => {
    setSelectedResource(resource)
    setIsAllocateDialogOpen(true)
  }

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
              {searchQuery ? "No resources match your search" : "No resources available"}
            </div>
          ) : (
            filteredAvailable.map((resource: any) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20">
                    <Package className="h-5 w-5 text-chart-2" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{resource.name}</h3>
                      <CheckCircle className="h-4 w-4 text-chart-2" />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Qty: {resource.quantity}
                      </Badge>
                      <Badge variant="outline">{resource.resource_type}</Badge>
                      {resource.location && (
                        <Badge variant="outline" className="text-xs">
                          {resource.location}
                        </Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full bg-transparent"
                      onClick={() => handleAllocate(resource)}
                    >
                      Allocate to Event
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="needed" className="space-y-3">
          {filteredNeeded.length === 0 ? (
            <div className="text-center text-muted-foreground">
              {searchQuery ? "No resources match your search" : "No resources needed"}
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
                      <h3 className="font-semibold text-foreground">{resource.name}</h3>
                      <XCircle className="h-4 w-4 text-chart-5" />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>

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

      <AddResourceDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <AllocateResourceDialog
        open={isAllocateDialogOpen}
        onOpenChange={setIsAllocateDialogOpen}
        resource={selectedResource}
      />
    </div>
  )
}
