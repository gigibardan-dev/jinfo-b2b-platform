"use client"

import { useState } from "react"
import { Agency } from "@/lib/types/agency"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, Edit, Ban, CheckCircle, Mail, Phone, Calendar } from "lucide-react"
import { EditAgencyModal } from "./EditAgencyModal"
import { AgencyDetailsModal } from "./AgencyDetailsModal"
import { cn } from "@/lib/utils"

interface AgenciesTableProps {
  agencies: Agency[]
  onUpdate: () => void
}

export function AgenciesTable({ agencies, onUpdate }: AgenciesTableProps) {
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Activ' },
      pending: { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'În așteptare' },
      suspended: { class: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Suspendat' },
    }
    const config = configs[status as keyof typeof configs] || configs.pending

    return (
      <Badge variant="outline" className={cn("font-semibold shadow-sm", config.class)}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleAction = async (agencyId: string, action: 'suspend' | 'activate') => {
    const msg = action === 'suspend' ? 'suspenzi' : 'activezi'
    if (!confirm(`Ești sigur că vrei să ${msg} această agenție?`)) return

    try {
      const response = await fetch(`/api/admin/agencies/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      })
      if (!response.ok) throw new Error()
      onUpdate()
    } catch (error) {
      alert('Eroare la procesarea cererii')
    }
  }

  if (agencies.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
        <p className="text-lg font-medium">Nu există agenții înregistrate.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-[250px] font-bold text-slate-700">Agenție</TableHead>
              <TableHead className="font-bold text-slate-700">Contact</TableHead>
              <TableHead className="text-center font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Comision %</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Activitate</TableHead>
              <TableHead className="text-right font-bold text-slate-700 text-blue-600">Total Venit</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id} className="hover:bg-blue-50/30 transition-colors group">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {agency.company_name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" /> {agency.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span className="text-slate-700 font-medium">{agency.contact_person}</span>
                    <span className="text-slate-500 flex items-center text-xs">
                      <Phone className="h-3 w-3 mr-1" /> {agency.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(agency.status)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                    {agency.commission_rate}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{agency.total_bookings || 0} rezervări</span>
                    <span className="text-[10px] text-amber-600 font-semibold uppercase italic">
                      {agency.pending_bookings || 0} în așteptare
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-extrabold text-blue-600">
                    {formatCurrency(agency.total_commission || 0)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-200">
                        <MoreHorizontal className="h-4 w-4 text-slate-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 shadow-xl border-slate-200">
                      <DropdownMenuLabel className="text-slate-400 text-[10px] uppercase tracking-widest">Opțiuni Agenție</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => { setSelectedAgency(agency); setIsDetailsModalOpen(true); }} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4 text-slate-500" /> Vezi detalii
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedAgency(agency); setIsEditModalOpen(true); }} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4 text-blue-500" /> Editează datele
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {agency.status === 'active' ? (
                        <DropdownMenuItem onClick={() => handleAction(agency.id, 'suspend')} className="text-rose-600 focus:text-rose-600 cursor-pointer">
                          <Ban className="mr-2 h-4 w-4" /> Suspendă accesul
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleAction(agency.id, 'activate')} className="text-emerald-600 focus:text-emerald-600 cursor-pointer">
                          <CheckCircle className="mr-2 h-4 w-4" /> Activează agenția
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedAgency && (
        <>
          <EditAgencyModal
            agency={selectedAgency}
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setSelectedAgency(null); }}
            onUpdate={onUpdate}
          />
          <AgencyDetailsModal
            agency={selectedAgency}
            isOpen={isDetailsModalOpen}
            onClose={() => { setIsDetailsModalOpen(false); setSelectedAgency(null); }}
          />
        </>
      )}
    </>
  )
}