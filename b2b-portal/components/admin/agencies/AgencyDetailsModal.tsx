'use client';

import { Agency } from '@/lib/types/agency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgencyDetailsModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyDetailsModal({ agency, isOpen, onClose }: AgencyDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activ', icon: '✅' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'În Așteptare', icon: '⏳' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendat', icon: '🚫' },
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const statusConfig = getStatusConfig(agency.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalii Agenție - {agency.company_name}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{agency.company_name}</h2>
                <p className="text-purple-100 text-sm">Detalii Complete Partener</p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 ${statusConfig.bg} ${statusConfig.text} flex items-center gap-2`}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <span>🆔</span>
              <span className="font-mono">{agency.id.slice(0, 12)}...</span>
            </span>
            <span className="flex items-center gap-1">
              <span>💰</span>
              <span className="font-bold">Comision: {agency.commission_rate}%</span>
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Company Info */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <span className="text-2xl">🏢</span>
              Informații Companie
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-xs text-gray-500 font-semibold mb-1">Registrul Comerțului</div>
                <div className="font-bold text-gray-900">{agency.trade_register || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-xs text-gray-500 font-semibold mb-1">CUI / CIF</div>
                <div className="font-bold text-gray-900">{agency.registration_number || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <span className="text-2xl">👤</span>
              Contact Principal
            </h3>
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 space-y-2">
              <div>
                <div className="text-xs text-blue-600 font-semibold mb-1">Persoană Contact</div>
                <div className="font-bold text-gray-900">{agency.contact_person}</div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <span>📧</span>
                  <span>{agency.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span>📞</span>
                  <span>{agency.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <span className="text-2xl">📍</span>
              Adresă Sediu Social
            </h3>
            <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
              <p className="text-gray-900">
                {agency.billing_address || 'N/A'}<br />
                {agency.billing_city || 'N/A'}, {agency.billing_county || 'N/A'}<br />
                {agency.billing_postal_code || 'N/A'}
              </p>
            </div>
          </div>

          {/* Banking Info */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <span className="text-2xl">🏦</span>
              Date Bancare
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-xs text-green-600 font-semibold mb-1">Bancă</div>
                <div className="font-bold text-gray-900">{agency.bank_name || 'N/A'}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-xs text-green-600 font-semibold mb-1">IBAN</div>
                <div className="font-mono text-sm text-gray-900">{agency.bank_account || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <span className="text-2xl">📊</span>
              Activitate & Statistici
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 text-center">
                <div className="text-3xl font-bold text-blue-600">{agency.total_bookings || 0}</div>
                <div className="text-xs text-gray-600 font-semibold mt-1">Total Rezervări</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                <div className="text-3xl font-bold text-yellow-600">{agency.pending_bookings || 0}</div>
                <div className="text-xs text-gray-600 font-semibold mt-1">În Așteptare</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(agency.total_commission || 0)}</div>
                <div className="text-xs text-gray-600 font-semibold mt-1">Venit Total</div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {agency.admin_notes && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                <span className="text-2xl">📝</span>
                Notițe Interne
              </h3>
              <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-xl">
                <p className="text-sm text-gray-700 italic leading-relaxed">{agency.admin_notes}</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t-2 border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Închide
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}