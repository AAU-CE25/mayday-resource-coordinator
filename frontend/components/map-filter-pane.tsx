"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Button } from "./ui/button"

interface MapFilterPaneProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter: string
  onPriorityChange: (priority: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
}

export function MapFilterPane({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
}: MapFilterPaneProps) {

  // Reset all filters
  const handleReset = () => {
    onSearchChange("");
    onPriorityChange("all");
    onStatusChange("all");
  };

  return (
    <div className="border-b border-border bg-secondary px-4 py-3">
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Map Filters</span>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events on map..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="1">Priority 1</SelectItem>
            <SelectItem value="2">Priority 2</SelectItem>
            <SelectItem value="3">Priority 3</SelectItem>
            <SelectItem value="4">Priority 4</SelectItem>
            <SelectItem value="5">Priority 5</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-2 hover:bg-secondary/80 active:scale-95 transition-transform"
        >
          <Filter className="h-4 w-4" />
          Reset filters
        </Button>

        {/* <button
          onClick={handleReset}
          className="wh-8 w-[130px]"
        >
            }}
          >
            Reset filters
          </Button>
        </div>

        {/* <button
          onClick={handleReset}
          className="wh-8 w-[130px]"
        >
          Reset Filters
        </button> */}

      </div>
    </div>

        

  )
}
