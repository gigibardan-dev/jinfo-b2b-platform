'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Circuit, Departure } from '@/lib/types/database';

interface PreBookingFormProps {
  circuit: Circuit;
  departure: Departure;
  agencyId: string;
  priceOption: any;
}

export default function PreBookingForm({ 
  circuit, 
  departure, 
  agencyId,
  priceOption 
}: PreBookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    num_adults: 2,
    num_children: 0,
    room_type: 'double',
    agency_notes: '',
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', passport: '' },
    { name: '', age: '', passport: '' },
  ]);

  // Calculează prețul total
  const pricePerPerson = priceOption.price || circuit.price_double || 0;
  const agencyCommission = 10;
  const agencyPricePerPerson = Math.round(pricePerPerson - (pricePerPerson * agencyCommission / 100));
  const totalPrice = agencyPricePerPerson * (formData.num_adults + formData.num_children);
  const commission = Math.round((pricePerPerson * (formData.num_adults + formData.num_children)) - totalPrice);

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Validare pasageri
      const totalPax = formData.num_adults + formData.num_children;
      if (passengers.slice(0, totalPax).some(p => !p.name || !p.age)) {
        throw new Error('Te rog completează numele și vârsta pentru toți pasagerii');
      }

      const { error: insertError } = await supabase
        .from('pre_bookings')
        .insert({
          agency_id: agencyId,
          circuit_id: circuit.id,
          departure_id: departure.id,
          num_adults: formData.num_adults,
          num_children: formData.num_children,
          room_type: formData.room_type,
          passengers: passengers.slice(0, totalPax),
          price_per_person: agencyPricePerPerson,
          total_price: totalPrice,
          agency_commission: commission,
          agency_notes: formData.agency_notes || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Success - redirect to bookings page
      router.push('/agency/bookings?success=true');

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'A apărut o eroare la crearea pre-rezervării');
    } finally {
      setLoading(false);
    }
  };

  // Update passengers array when num changes
  const updatePassengerCount = (adults: number, children: number) => {
    const total = adults + children;
    const newPassengers = [...passengers];
    
    while (newPassengers.length < total) {
      newPassengers.push({ name: '', age: '', passport: '' });
    }
    
    setPassengers(newPassengers.slice(0, total));
    setFormData({ ...formData, num_adults: adults, num_children: children });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-red-800">Eroare</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Număr persoane */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>Număr persoane</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adulți (18+ ani) *
            </label>
            <select
              value={formData.num_adults}
              onChange={(e) => updatePassengerCount(parseInt(e.target.value), formData.num_children)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="1">1 adult</option>
              <option value="2">2 adulți</option>
              <option value="3">3 adulți</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copii (sub 18 ani)
            </label>
            <select
              value={formData.num_children}
              onChange={(e) => updatePassengerCount(formData.num_adults, parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="0">0 copii</option>
              <option value="1">1 copil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date pasageri */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✈️</span>
          <span>Date pasageri</span>
        </h3>
        
        <div className="space-y-4">
          {passengers.slice(0, formData.num_adults + formData.num_children).map((passenger, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                Pasager {index + 1} {index < formData.num_adults ? '(Adult)' : '(Copil)'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nume complet *
                  </label>
                  <input
                    type="text"
                    value={passenger.name}
                    onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                    required
                    placeholder="Ex: Popescu Ion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Vârstă *
                  </label>
                  <input
                    type="number"
                    value={passenger.age}
                    onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                    required
                    min="0"
                    max="120"
                    placeholder="Ex: 45"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Pașaport (opțional)
                  </label>
                  <input
                    type="text"
                    value={passenger.passport}
                    onChange={(e) => handlePassengerChange(index, 'passport', e.target.value)}
                    placeholder="Ex: RO123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observații */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📝</span>
          <span>Observații și cerințe speciale</span>
        </h3>
        
        <textarea
          value={formData.agency_notes}
          onChange={(e) => setFormData({ ...formData, agency_notes: e.target.value })}
          rows={4}
          placeholder="Ex: Client dorește loc la geam, regim vegetarian, cameră la etaj înalt..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
        />
      </div>

      {/* Sumar preț */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>💰</span>
          <span>Sumar financiar</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Preț per persoană (agenție):</span>
            <span className="font-semibold text-gray-900">{agencyPricePerPerson} EUR</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700">Număr persoane:</span>
            <span className="font-semibold text-gray-900">
              {formData.num_adults + formData.num_children}
            </span>
          </div>
          
          <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">TOTAL:</span>
            <span className="text-3xl font-bold text-orange-600">{totalPrice} EUR</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700 font-medium">Comisionul tău:</span>
              <span className="text-lg font-bold text-green-600">+{commission} EUR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Se trimite...</span>
          </>
        ) : (
          <>
            <span>🎯</span>
            <span>Trimite Pre-Rezervarea</span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Pre-rezervarea va fi validată de J'Info Tours în maximum 24h
      </p>
    </form>
  );
}