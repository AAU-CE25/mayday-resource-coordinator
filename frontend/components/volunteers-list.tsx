"use client"

import { useState } from "react"
import { useVolunteers } from "@/hooks/use-volunteers"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Phone, MapPin, Plus, Search, UserCheck, UserX } from "lucide-react"
import { AddVolunteerDialog } from "./add-volunteer-dialog"
import { AssignVolunteerDialog } from "./assign-volunteer-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function VolunteersList() {
  const { data: volunteers, isLoading } = useVolunteers()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null)

  const filteredVolunteers = volunteers?.filter((volunteer: any) => {
    const matchesSearch =
      volunteer.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.phonenumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || volunteer.availability === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading volunteers...</div>
  }

  const handleAssign = (volunteer: any) => {
    setSelectedVolunteer(volunteer)
    setIsAssignDialogOpen(true)
  }

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
          {searchQuery || statusFilter !== "all" ? "No volunteers match your filters" : "No volunteers registered"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVolunteers.map((volunteer: any) => (
            <Card key={volunteer.id} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    volunteer.availability === "available"
                      ? "bg-chart-2/20"
                      : volunteer.availability === "assigned"
                        ? "bg-chart-4/20"
                        : "bg-muted"
                  }`}
                >
                  <User
                    className={`h-5 w-5 ${
                      volunteer.availability === "available"
                        ? "text-chart-2"
                        : volunteer.availability === "assigned"
                          ? "text-chart-4"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{volunteer.user.name}</h3>
                    {volunteer.availability === "available" ? (
                      <UserCheck className="h-4 w-4 text-chart-2" />
                    ) : volunteer.availability === "assigned" ? (
                      <UserCheck className="h-4 w-4 text-chart-4" />
                    ) : (
                      <UserX className="h-4 w-4 text-muted-foreground" />
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
                      <span>{volunteer.location.address || "Location available"}</span>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        volunteer.availability === "available"
                          ? "default"
                          : volunteer.availability === "assigned"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {volunteer.availability || "Available"}
                    </Badge>
                    {volunteer.skills &&
                      volunteer.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                  </div>

                  {volunteer.assigned_event && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Assigned to Event #{volunteer.assigned_event}
                      </Badge>
                    </div>
                  )}

                  {volunteer.availability === "available" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full bg-transparent"
                      onClick={() => handleAssign(volunteer)}
                    >
                      Assign to Event
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* <AddVolunteerDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <AssignVolunteerDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        volunteer={selectedVolunteer}
      /> */}
    </div>
  )
}
