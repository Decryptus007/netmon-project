
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const DeviceTimePicker = () => {
  const [startTime] = useState("Feb 18, 2025 @ 22:49:37.965");
  const [endTime] = useState("Feb 18, 2025 @ 23:49:37.965");

  return (
    <div className="flex items-center gap-2 p-2 bg-white border rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button className={cn(
          "px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 truncate text-left flex-1",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}>
          {startTime}
        </button>
        <span className="text-gray-400 shrink-0">→</span>
        <button className={cn(
          "px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 truncate text-left flex-1",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}>
          {endTime}
        </button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};