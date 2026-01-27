"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Agency } from "@/lib/types/agency"
import { EditAgencyModal } from "./EditAgencyModal"
import { AgencyDetailsModal } from "./AgencyDetailsModal"
import Link from "next/link"

interface AgenciesTableClientProps {
  agencies: Agency[]
  initialStatus: string
}

export function AgenciesTableClient({ agencies, initialStatus }: AgenciesTableClientProps) {
  const router = useRouter()
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState(initialStatus)

  const handleUpdate = () => {
    router.refresh()
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { 
        gradient: 'from-green-50 to-emerald-50', 
        badge: 'bg-green-100 text-green-800 border-green-300',
        icon: '✅',
        text: 'Activ' 
      },
      pending: { 
        gradient: 'from-yellow-50 to-amber-50', 
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⏳',
        text: 'În Așteptare' 
      },
      suspended: { 
        gradient: 'from-red-50 to-rose-50', 
        badge: 'bg-red-100 text-red-800 border-red-300',
        icon: '🚫',
        text: 'Suspendat' 
      },
    }
    return configs[status as keyof typeof configs] || configs.pending
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
      handleUpdate()
    } catch (error) {
      alert('Eroare la procesarea cererii')
    }
  }

  const handleFilterChange = (status: string) => {
    setCurrentFilter(status)
    const params = new URLSearchParams()
    if (status !== 'all') {
      params.set('status', status)
    }
    router.push(`/admin/agencies?${params.toString()}`)
  }

  const filters = [
    { value: "all", label: "Toate", count: agencies.length },
    { value: "active", label: "Active", count: agencies.filter(a => a.status === 'active').length },
    { value: "pending", label: "În Așteptare", count: agencies.filter(a => a.status === 'pending').length },
    { value: "suspended", label: "Suspendate", count: agencies.filter(a => a.status === 'suspended').length },
  ]

  return (
    <>
      {/* Filter Tabs - Always visible */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2 flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              currentFilter === filter.value
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                currentFilter === filter.value
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State or Agencies Grid */}
      {agencies.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Nicio Agenție
          </h3>
          <p className="text-gray-600 mb-6">
            {currentFilter !== 'all' 
              ? `Nu există agenții cu statusul "${currentFilter}"`
              : 'Nu există agenții înregistrate în sistem'}
          </p>
          {currentFilter === 'all' && (
            <Link
              href="/admin/create-agency"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-semibold"
            >
              ➕ Adaugă Prima Agenție
            </Link>
          )}
        </div>
      ) : (
        /* Agencies Grid */
        <div className="grid grid-cols-1 gap-4">
        {agencies.map((agency) => {
          const statusConfig = getStatusConfig(agency.status)
          
          return (
            <div
              key={agency.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 overflow-hidden"
            >
              {/* Status Header */}
              <div className={`bg-gradient-to-r ${statusConfig.gradient} px-6 py-3 border-b-2 ${statusConfig.badge.includes('green') ? 'border-green-200' : statusConfig.badge.includes('yellow') ? 'border-yellow-200' : 'border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{statusConfig.icon}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${statusConfig.badge}`}>
                      {statusConfig.text}
                    </span>
                    <span className="text-sm font-mono text-gray-600">
                      ID: {agency.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/60 rounded-lg text-sm font-bold text-gray-700">
                      Comision: {agency.commission_rate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Company Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🏢</span>
                      <h3 className="text-lg font-bold text-gray-900">Informații Companie</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Nume Companie</div>
                        <div className="font-bold text-gray-900">{agency.company_name}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Reg. Com.</div>
                          <div className="text-sm font-semibold text-gray-700">{agency.trade_register || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">CUI</div>
                          <div className="text-sm font-semibold text-gray-700">{agency.registration_number || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">👤</span>
                      <h3 className="text-lg font-bold text-gray-900">Contact</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Persoană Contact</div>
                        <div className="font-semibold text-gray-900">{agency.contact_person}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>📧</span>
                        <span className="truncate">{agency.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>📞</span>
                        <span>{agency.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📊</span>
                      <h3 className="text-lg font-bold text-gray-900">Activitate</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Rezervări</span>
                        <span className="text-lg font-bold text-gray-900">{agency.total_bookings || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">În Așteptare</span>
                        <span className="text-lg font-bold text-yellow-600">{agency.pending_bookings || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Venit Total</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(agency.total_commission || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t-2 border-gray-100">
                  <button
                    onClick={() => { setSelectedAgency(agency); setIsDetailsModalOpen(true); }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                  >
                    👁️ Vezi Detalii
                  </button>
                  <button
                    onClick={() => { setSelectedAgency(agency); setIsEditModalOpen(true); }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                  >
                    ✏️ Editează
                  </button>
                  {agency.status === 'active' ? (
                    <button
                      onClick={() => handleAction(agency.id, 'suspend')}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      🚫 Suspendă
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(agency.id, 'activate')}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      ✅ Activează
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Modals */}
      {selectedAgency && (
        <>
          <EditAgencyModal
            agency={selectedAgency}
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setSelectedAgency(null); }}
            onUpdate={handleUpdate}
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