'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Circuit, Departure } from '@/lib/types/database';
import { applyDiscount, getAgencyCommission } from '@/lib/types/database';

interface PreBookingFormProps {
  circuit: Circuit;
  departure: Departure;
  allDepartures: Departure[];
  agencyId: string;
  priceOption: any;
  allPriceOptions: any[];
  initialPriceOptionIndex: number;
  commissionRate: number;
}

// Helper function pentru a detecta capacitatea camerei din type
function getRoomCapacity(roomType: string): { 
  min: number; 
  max: number; 
  defaultAdults: number; 
  defaultChildren: number;
  isFixed: boolean;
} {
  const type = roomType.toLowerCase();
  
  if (type.includes('persoana') && type.includes('camera dubla')) {
    return { min: 1, max: 1, defaultAdults: 1, defaultChildren: 0, isFixed: true };
  }
  if ((type.includes('copil') && type.includes('adult')) || 
      (type.includes('2 adulti') && type.includes('copil'))) {
    return { min: 3, max: 3, defaultAdults: 2, defaultChildren: 1, isFixed: true };
  }
  if ((type.includes('3 persoane') || type.includes('trei persoane')) && type.includes('tripla')) {
    return { min: 3, max: 3, defaultAdults: 3, defaultChildren: 0, isFixed: true };
  }
  if (type.includes('single') || type.includes('singulara')) {
    return { min: 1, max: 1, defaultAdults: 1, defaultChildren: 0, isFixed: true };
  }
  if (type.includes('tripla') || type.includes('triple')) {
    return { min: 3, max: 3, defaultAdults: 2, defaultChildren: 1, isFixed: false };
  }
  if (type.includes('camera dubla') || type.includes('double') || type.includes('dubla')) {
    return { min: 2, max: 2, defaultAdults: 2, defaultChildren: 0, isFixed: false };
  }
  return { min: 1, max: 1, defaultAdults: 1, defaultChildren: 0, isFixed: true };
}

export default function PreBookingForm({ 
  circuit, 
  departure: initialDeparture,
  allDepartures,
  agencyId,
  priceOption: initialPriceOption,
  allPriceOptions,
  initialPriceOptionIndex,
  commissionRate
}: PreBookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedDeparture, setSelectedDeparture]           = useState(initialDeparture);
  const [selectedPriceOptionIndex, setSelectedPriceOptionIndex] = useState(initialPriceOptionIndex);
  const [selectedPriceOption, setSelectedPriceOption]       = useState(initialPriceOption);
  
  const roomCapacity = getRoomCapacity(selectedPriceOption.type || '');
  
  const [formData, setFormData] = useState({
    num_adults:    roomCapacity.defaultAdults,
    num_children:  roomCapacity.defaultChildren,
    room_type:     'double',
    agency_notes:  '',
  });

  const [passengers, setPassengers] = useState(
    Array(roomCapacity.max).fill(null).map(() => ({ name: '', age: '', passport: '' }))
  );

  useEffect(() => {
    const capacity = getRoomCapacity(selectedPriceOption.type || '');
    setFormData(prev => ({
      ...prev,
      num_adults:   capacity.defaultAdults,
      num_children: capacity.defaultChildren
    }));
    setPassengers(Array(capacity.max).fill(null).map(() => ({ name: '', age: '', passport: '' })));
  }, [selectedPriceOption]);

  // ── Calcul prețuri cu suport reduceri ────────────────────────────────────
  // 1. Prețul original (din scraping) pentru opțiunea selectată
  const originalPrice  = selectedPriceOption.price || circuit.price_double || 0

  // 2. Aplicăm reducerea dacă există
  const effectivePrice = circuit.is_discounted
    ? (applyDiscount(originalPrice, circuit.discount_percentage) ?? originalPrice)
    : originalPrice

  // 3. Comisionul agenției din prețul redus
  const commission     = getAgencyCommission(effectivePrice, commissionRate) ?? 0

  // 4. Prețul final al agenției
  const agencyPriceTotal = Math.round(effectivePrice - commission)

  // 5. Preț per persoană (doar pentru afișare)
  const totalPeople          = formData.num_adults + formData.num_children
  const pricePerPersonDisplay = totalPeople > 0 ? Math.round(agencyPriceTotal / totalPeople) : agencyPriceTotal

  const handleDepartureChange = (departureId: string) => {
    const newDeparture = allDepartures.find(d => d.id === departureId);
    if (newDeparture) {
      setSelectedDeparture(newDeparture);
      const params = new URLSearchParams(searchParams.toString());
      params.set('departure', departureId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const handlePriceOptionChange = (optionIndex: number) => {
    const newOption = allPriceOptions[optionIndex];
    if (newOption) {
      setSelectedPriceOptionIndex(optionIndex);
      setSelectedPriceOption(newOption);
      const params = new URLSearchParams(searchParams.toString());
      params.set('price_option', optionIndex.toString());
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

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

      const totalPax = formData.num_adults + formData.num_children;
      if (totalPax !== roomCapacity.max) {
        throw new Error(`Pentru ${selectedPriceOption.type} trebuie să ai exact ${roomCapacity.max} ${roomCapacity.max === 1 ? 'persoană' : 'persoane'}`);
      }

      if (passengers.slice(0, totalPax).some(p => !p.name || !p.age)) {
        throw new Error('Te rog completează numele și vârsta pentru toți pasagerii');
      }

      const { error: insertError } = await supabase
        .from('pre_bookings')
        .insert({
          agency_id:        agencyId,
          circuit_id:       circuit.id,
          departure_id:     selectedDeparture.id,
          num_adults:       formData.num_adults,
          num_children:     formData.num_children,
          room_type:        formData.room_type,
          passengers:       passengers.slice(0, totalPax),
          price_per_person: pricePerPersonDisplay,
          total_price:      agencyPriceTotal,   // prețul corect — după reducere și comision
          agency_commission: commission,         // comision din prețul redus
          agency_notes:     formData.agency_notes || null,
          status:           'pending',
        });

      if (insertError) throw insertError;

      router.push('/agency/bookings?success=true');

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'A apărut o eroare la crearea pre-rezervării');
    } finally {
      setLoading(false);
    }
  };

  const updatePassengerCount = (adults: number, children: number) => {
    const total = adults + children;
    if (total > roomCapacity.max) {
      const diff = total - roomCapacity.max;
      if (children >= diff) children -= diff;
      else adults -= diff;
    }
    const newPassengers = [...passengers];
    while (newPassengers.length < total) newPassengers.push({ name: '', age: '', passport: '' });
    setPassengers(newPassengers.slice(0, total));
    setFormData({ ...formData, num_adults: adults, num_children: children });
  };

  const getAdultsOptions = () => {
    if (roomCapacity.isFixed) {
      const num = roomCapacity.defaultAdults;
      return [<option key={num} value={num}>{num} {num === 1 ? 'adult' : 'adulți'}</option>];
    }
    const options = [];
    const maxAdults = Math.min(4, roomCapacity.max);
    for (let i = 1; i <= maxAdults; i++) {
      const wouldBeValid = (i + formData.num_children) === roomCapacity.max;
      if (wouldBeValid || i === formData.num_adults) {
        options.push(<option key={i} value={i}>{i} {i === 1 ? 'adult' : 'adulți'}</option>);
      }
    }
    return options;
  };

  const getChildrenOptions = () => {
    if (roomCapacity.isFixed) {
      const num = roomCapacity.defaultChildren;
      return [<option key={num} value={num}>{num} {num === 1 ? 'copil' : 'copii'}</option>];
    }
    const options = [];
    const maxChildren = roomCapacity.max - 1;
    for (let i = 0; i <= Math.min(2, maxChildren); i++) {
      const wouldBeValid = (formData.num_adults + i) === roomCapacity.max;
      if (wouldBeValid || i === formData.num_children) {
        options.push(<option key={i} value={i}>{i} {i === 1 ? 'copil' : 'copii'}</option>);
      }
    }
    return options;
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

      {/* Selectare plecare și opțiune de preț */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📅</span>
          <span>Plecare și opțiune cazare</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dată plecare *</label>
            <select
              value={selectedDeparture.id}
              onChange={(e) => handleDepartureChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {allDepartures.map((dep) => {
                const depDate = new Date(dep.departure_date);
                const retDate = new Date(dep.return_date);
                return (
                  <option key={dep.id} value={dep.id}>
                    {depDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' → '}
                    {retDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opțiune cazare *</label>
            <select
              value={selectedPriceOptionIndex}
              onChange={(e) => handlePriceOptionChange(parseInt(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {allPriceOptions.map((option, idx) => {
                // Dropdown arată prețul agenției (după reducere + comision)
                const optOriginal  = option.price || 0
                const optEffective = circuit.is_discounted
                  ? (applyDiscount(optOriginal, circuit.discount_percentage) ?? optOriginal)
                  : optOriginal
                const optCommission  = getAgencyCommission(optEffective, commissionRate) ?? 0
                const optAgencyPrice = Math.round(optEffective - optCommission)
                return (
                  <option key={idx} value={idx}>
                    {option.type} — {optAgencyPrice.toLocaleString('ro-RO')} {option.currency || 'EUR'}
                  </option>
                );
              })}
            </select>
            {selectedPriceOption.info && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedPriceOption.info.replace(/\t+/g, ' ').trim()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Număr persoane */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>Număr persoane</span>
          <span className="text-sm font-normal text-orange-600 ml-auto">
            ({roomCapacity.max} {roomCapacity.max === 1 ? 'persoană' : 'persoane'})
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adulți (18+ ani) *</label>
            <select
              value={formData.num_adults}
              onChange={(e) => updatePassengerCount(parseInt(e.target.value), formData.num_children)}
              required
              disabled={roomCapacity.isFixed}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {getAdultsOptions()}
            </select>
            {roomCapacity.isFixed && (
              <p className="text-xs text-gray-500 mt-1">
                {roomCapacity.max === 1 ? 'Opțiune pentru 1 adult' : `Fix ${formData.num_adults} ${formData.num_adults === 1 ? 'adult' : 'adulți'}`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Copii (0-11.99 ani)</label>
            <select
              value={formData.num_children}
              onChange={(e) => updatePassengerCount(formData.num_adults, parseInt(e.target.value))}
              disabled={roomCapacity.isFixed}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {getChildrenOptions()}
            </select>
            {roomCapacity.isFixed && formData.num_children > 0 && (
              <p className="text-xs text-gray-500 mt-1">Fix {formData.num_children} copil (0-11.99 ani)</p>
            )}
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700">
            💡 <strong>{selectedPriceOption.type}</strong> — 
            {roomCapacity.isFixed 
              ? ` opțiune fixă pentru ${roomCapacity.max} ${roomCapacity.max === 1 ? 'persoană' : 'persoane'}` 
              : ` permite ${roomCapacity.max} persoane`
            }
          </p>
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
                Pasager {index + 1} {index < formData.num_adults ? '(Adult)' : '(Copil 0-11.99 ani)'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nume complet *</label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vârstă *</label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pașaport (opțional)</label>
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
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Opțiune:</span>
            <span className="font-semibold text-gray-900 text-xs">{selectedPriceOption.type}</span>
          </div>

          {/* Preț listă */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Preț listă:</span>
            <span className={circuit.is_discounted ? 'text-gray-400 line-through' : 'font-semibold text-gray-900'}>
              {originalPrice.toLocaleString('ro-RO')} EUR
            </span>
          </div>

          {/* Preț redus — doar dacă e reducere */}
          {circuit.is_discounted && (
            <div className="flex justify-between items-center text-sm text-orange-600 font-semibold">
              <span>Preț redus ({circuit.discount_percentage}%):</span>
              <span>{effectivePrice.toLocaleString('ro-RO')} EUR</span>
            </div>
          )}

          {totalPeople > 1 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Număr persoane:</span>
              <span className="font-semibold text-gray-900">{totalPeople}</span>
            </div>
          )}
          
          <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">TOTAL AGENȚIE:</span>
            <span className="text-3xl font-bold text-orange-600">{agencyPriceTotal.toLocaleString('ro-RO')} EUR</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700 font-medium">Comisionul tău ({commissionRate}%):</span>
              <span className="text-lg font-bold text-green-600">+{commission.toLocaleString('ro-RO')} EUR</span>
            </div>
          </div>

          {circuit.is_discounted && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700 text-center">
              🏷️ Reducere de {circuit.discount_percentage}% aplicată — comisionul calculat din prețul redus
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-1">
            💡 Preț final pentru {totalPeople} {totalPeople === 1 ? 'persoană' : 'persoane'}
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