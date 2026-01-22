'use client';

import { Agency } from '@/lib/types/agency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Landmark, FileText, PieChart } from 'lucide-react';

interface AgencyDetailsModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyDetailsModal({ agency, isOpen, onClose }: AgencyDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Header cu gradient subtil */}
        <div className="bg-slate-900 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-400" />
                {agency.company_name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Detalii complete partener</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 uppercase tracking-widest text-[10px]">
              ID: {agency.id.slice(0, 8)}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-white">
          {/* Grid de Informatii */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Contact Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-3 w-3" /> Contact Principal
              </h3>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{agency.contact_person}</p>
                <p className="text-sm text-slate-600 italic">{agency.email}</p>
                <p className="text-sm text-slate-600">{agency.phone}</p>
              </div>
            </div>

            {/* Billing Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Sediu Social
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {agency.billing_address}, {agency.billing_city}<br />
                  {agency.billing_county}, {agency.billing_postal_code}
                </p>
              </div>
            </div>

            {/* Legal Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3 w-3" /> Date Fiscale
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-slate-500">Reg. Com:</span> {agency.trade_register}</p>
                <p><span className="text-slate-500">CUI:</span> {agency.registration_number}</p>
              </div>
            </div>

            {/* Bank Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-3 w-3" /> Date Bancare
              </h3>
              <div className="space-y-1 text-sm font-mono">
                <p className="text-slate-700">{agency.bank_name || 'N/A'}</p>
                <p className="text-blue-600 text-[11px] truncate">{agency.bank_account || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Admin Notes Box */}
          {agency.admin_notes && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Notițe Interne</h4>
              <p className="text-sm text-slate-600 italic line-clamp-3">"{agency.admin_notes}"</p>
            </div>
          )}

          {/* Footer Stats - Quick Glance */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <div className="flex gap-4">
               <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Comision</span>
                  <span className="font-bold text-slate-900">{agency.commission_rate}%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Total Rezervări</span>
                  <span className="font-bold text-slate-900">{agency.total_bookings || 0}</span>
               </div>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-md hover:bg-slate-800 transition-colors"
            >
              Închide Detalii
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}