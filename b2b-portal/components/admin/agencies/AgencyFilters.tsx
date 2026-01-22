"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AgencyFiltersProps {
  currentStatus: string
}

export function AgencyFilters({ currentStatus }: AgencyFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    router.push(`/admin/agencies?${params.toString()}`)
  }

  const filters = [
    { value: "all", label: "Toate" },
    { value: "active", label: "Active" },
    { value: "pending", label: "În Așteptare" },
    { value: "suspended", label: "Suspendate" },
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-1">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant="ghost"
            onClick={() => handleStatusChange(filter.value)}
            className={cn(
              "rounded-none rounded-t-lg border-b-2 border-transparent px-6 py-3",
              currentStatus === filter.value 
                ? "border-blue-600 text-blue-600 font-semibold bg-blue-50" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
