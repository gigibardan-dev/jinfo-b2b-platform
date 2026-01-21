// app/agency/profile/AgencyProfileForm.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AgencyData {
  id: string;
  company_name: string;
  trade_register: string;
  registration_number: string;
  contact_person: string;
  phone: string;
  billing_address: string;
  billing_city: string;
  billing_county: string;
  billing_postal_code: string;
  bank_name: string;
  bank_account: string;
  commission_rate: string;
}

interface AgencyProfileFormProps {
  agencyData: AgencyData;
  userId: string;
}

export default function AgencyProfileForm({ agencyData, userId }: AgencyProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    company_name: agencyData.company_name || '',
    trade_register: agencyData.trade_register || '',
    registration_number: agencyData.registration_number || '',
    contact_person: agencyData.contact_person || '',
    phone: agencyData.phone || '',
    billing_address: agencyData.billing_address || '',
    billing_city: agencyData.billing_city || '',
    billing_county: agencyData.billing_county || '',
    billing_postal_code: agencyData.billing_postal_code || '',
    bank_name: agencyData.bank_name || '',
    bank_account: agencyData.bank_account || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          company_name: formData.company_name,
          trade_register: formData.trade_register,
          registration_number: formData.registration_number,
          contact_person: formData.contact_person,
          phone: formData.phone,
          billing_address: formData.billing_address,
          billing_city: formData.billing_city,
          billing_county: formData.billing_county,
          billing_postal_code: formData.billing_postal_code,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setIsEditing(false);
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'A apărut o eroare la actualizarea profilului');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    setFormData({
      company_name: agencyData.company_name || '',
      trade_register: agencyData.trade_register || '',
      registration_number: agencyData.registration_number || '',
      contact_person: agencyData.contact_person || '',
      phone: agencyData.phone || '',
      billing_address: agencyData.billing_address || '',
      billing_city: agencyData.billing_city || '',
      billing_county: agencyData.billing_county || '',
      billing_postal_code: agencyData.billing_postal_code || '',
      bank_name: agencyData.bank_name || '',
      bank_account: agencyData.bank_account || '',
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <div>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <span className="text-xl">✓</span>
            <span className="font-medium">Profilul a fost actualizat cu succes!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-xl">✕</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Toggle Edit Mode Button */}
      {!isEditing && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2"
          >
            <span>✏️</span>
            <span>Editează Profilul</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏢</span>
            <span>Informații Companie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nume Companie *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registrul Comerțului *
              </label>
              <input
                type="text"
                name="trade_register"
                value={formData.trade_register}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUI / CIF *
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persoană de Contact *
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rată Comision
              </label>
              <input
                type="text"
                value={`${agencyData.commission_rate}%`}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Doar administratorii pot modifica rata de comision
              </p>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📄</span>
            <span>Informații Facturare</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresă Facturare *
              </label>
              <input
                type="text"
                name="billing_address"
                value={formData.billing_address}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oraș *
              </label>
              <input
                type="text"
                name="billing_city"
                value={formData.billing_city}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Județ *
              </label>
              <input
                type="text"
                name="billing_county"
                value={formData.billing_county}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cod Poștal *
              </label>
              <input
                type="text"
                name="billing_postal_code"
                value={formData.billing_postal_code}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏦</span>
            <span>Informații Bancare</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nume Bancă *
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IBAN *
              </label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Only shown in edit mode */}
        {isEditing && (
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Se salvează...' : 'Salvează Modificările'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Anulează
            </button>
          </div>
        )}
      </form>
    </div>
  );
}