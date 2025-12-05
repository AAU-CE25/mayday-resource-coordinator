"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusMultiSelect, DEFAULT_STATUS_SELECTION } from "@/components/filters/status-multi-select"

interface MapFilterPaneProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter: string
  onPriorityChange: (priority: string) => void
  statusFilter: string[]
  onStatusChange: (status: string[]) => void
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
    onStatusChange([...DEFAULT_STATUS_SELECTION]);
  };

  return (
    <div className="border-b border-border bg-secondary px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Map Filters
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events on map..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:flex-1 lg:justify-end">
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="h-8 w-[140px]">
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

          <StatusMultiSelect
            value={statusFilter}
            onChange={onStatusChange}
            size="sm"
            className="w-full lg:w-auto"
          />

          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2 hover:bg-secondary/80 active:scale-95 transition-transform"
          >
            <Filter className="h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>
    </div>

        

  )
}
