"use client"

import { useRouter } from "next/navigation"
import { Agency } from "@/lib/types/agency"
import { AgenciesTable } from "./AgenciesTable"

interface AgenciesTableClientProps {
  agencies: Agency[]
}

export function AgenciesTableClient({ agencies }: AgenciesTableClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return <AgenciesTable agencies={agencies} onUpdate={handleUpdate} />
}
