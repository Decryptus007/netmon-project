"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DeviceInfoSkeleton() {
  const Section = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid md:grid-cols-2 gap-6 p-4 bg-white rounded-lg border">
      <Section />
      <Section />
    </div>
  )
} 