"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
] as const;

export const DEFAULT_STATUS_SELECTION = ["active", "pending"] as const;

interface StatusMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  size?: "sm" | "default";
  className?: string;
}

export function StatusMultiSelect({
  value,
  onChange,
  size = "default",
  className,
}: StatusMultiSelectProps) {
  const buttonWidthClass = "min-w-[92px] justify-center";

  const toggleStatus = (status: string) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const selectAll = () => onChange(STATUS_OPTIONS.map((opt) => opt.value));
  const clearAll = () => onChange([]);

  const allSelected =
    value.length > 0 &&
    STATUS_OPTIONS.every((option) => value.includes(option.value));

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        size={size}
        variant={allSelected ? "default" : "outline"}
        onClick={allSelected ? clearAll : selectAll}
        className={clsx("text-xs sm:text-sm", buttonWidthClass)}
      >
        {allSelected ? "Clear" : "Select All"}
      </Button>
      {STATUS_OPTIONS.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <Button
            key={option.value}
            type="button"
            size={size}
            variant={isSelected ? "default" : "outline"}
            onClick={() => toggleStatus(option.value)}
            className={clsx("text-xs capitalize sm:text-sm", buttonWidthClass)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

