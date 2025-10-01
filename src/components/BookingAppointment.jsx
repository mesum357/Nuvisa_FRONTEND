import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppointmentData } from '@/hooks/useAppointmentData';

const BookingAppointment = ({ onComplete, loading, validateAppointment, travelerData, disabled = false }) => {
  const { cities, slots, loadingCities, loadingSlots, error } = useAppointmentData();

  // Parse existing date strings back to Date objects for DatePicker
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle format like "19/09/2025"
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]); // year, month-1, day
    }
    return null;
  };

  // Extract date range from existing data if it exists
  const getInitialDates = (preference) => {
    const existingData = travelerData?.appointment?.[preference];
    if (existingData?.dateRange) {
      const dateRange = existingData.dateRange;
      if (dateRange.includes(' - ')) {
        const [startStr, endStr] = dateRange.split(' - ');
        return {
          dateRangeStart: parseDate(startStr),
          dateRangeEnd: parseDate(endStr)
        };
      }
    }
    return {
      dateRangeStart: null,
      dateRangeEnd: null
    };
  };

  const [appointmentData, setAppointmentData] = useState({
    preference1: {
      city: travelerData?.appointment?.preference1?.city || '',
      ...getInitialDates('preference1'),
      slot: travelerData?.appointment?.preference1?.slot || ''
    },
    preference2: {
      city: travelerData?.appointment?.preference2?.city || '',
      ...getInitialDates('preference2'),
      slot: travelerData?.appointment?.preference2?.slot || ''
    }
  });

  const [errors, setErrors] = useState({
    preference1: { city: '', dateRange: '', slot: '' },
    preference2: { city: '', dateRange: '', slot: '' }
  });

  const handleInputChange = (preference, field, value) => {
    setAppointmentData(prev => ({
      ...prev,
      [preference]: {
        ...prev[preference],
        [field]: value
      }
    }));
    // Clear field error when user changes the input
    setErrors(prev => ({
      ...prev,
      [preference]: {
        ...prev[preference],
        [field]: ''
      }
    }));
  };

  const handleDateRangeChange = (preference, dates) => {
    const [start, end] = dates;
    setAppointmentData(prev => ({
      ...prev,
      [preference]: {
        ...prev[preference],
        dateRangeStart: start || null,
        dateRangeEnd: end || null,
      }
    }));

    // Clear dateRange error
    setErrors(prev => ({
      ...prev,
      [preference]: {
        ...prev[preference],
        dateRange: ''
      }
    }));
  };

  const handleSave = () => {
    // Validate that preference 1 is filled (city, date range, slot)
    const newErrors = { preference1: {}, preference2: { city: '', dateRange: '', slot: '' } };
    let hasError = false;

    if (!appointmentData.preference1.city) {
      newErrors.preference1.city = 'Please select a city for Preference 1';
      hasError = true;
    }

    if (!appointmentData.preference1.dateRangeStart || !appointmentData.preference1.dateRangeEnd) {
      newErrors.preference1.dateRange = 'Please select a date range for Preference 1';
      hasError = true;
    }

    if (!appointmentData.preference1.slot) {
      newErrors.preference1.slot = 'Please select a slot for Preference 1';
      hasError = true;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));

    if (hasError) return; // bail out, inline errors will be shown

    // Validate preference2 if user entered any field (partial validation)
    const p2 = appointmentData.preference2;
    const p2HasAny = p2.city || p2.dateRangeStart || p2.dateRangeEnd || p2.slot;
    if (p2HasAny) {
      const newP2Errors = { city: '', dateRange: '', slot: '' };
      let p2Error = false;

      if (p2.city && typeof p2.city === 'string' && p2.city.trim() === '') {
        newP2Errors.city = 'Please select a city for Preference 2';
        p2Error = true;
      }

      if ((p2.dateRangeStart && !p2.dateRangeEnd) || (!p2.dateRangeStart && p2.dateRangeEnd)) {
        newP2Errors.dateRange = 'Please complete the date range for Preference 2';
        p2Error = true;
      }

      if (p2.slot && typeof p2.slot === 'string' && p2.slot.trim() === '') {
        newP2Errors.slot = 'Please select a slot for Preference 2';
        p2Error = true;
      }

      if (p2Error) {
        setErrors(prev => ({ ...prev, preference2: newP2Errors }));
        return;
      }
    }

    // Format the appointment data to include a human-readable dateRange string
    const formatDate = (d) => {
      if (!d) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatted = {
      preference1: {
        city: appointmentData.preference1.city,
        dateRange: `${formatDate(appointmentData.preference1.dateRangeStart)} - ${formatDate(appointmentData.preference1.dateRangeEnd)}`,
        slot: appointmentData.preference1.slot,
        // Also keep the individual date fields for validation
        dateRangeStart: appointmentData.preference1.dateRangeStart,
        dateRangeEnd: appointmentData.preference1.dateRangeEnd
      },
      preference2: {
        city: appointmentData.preference2.city,
        dateRange: appointmentData.preference2.dateRangeStart && appointmentData.preference2.dateRangeEnd
          ? `${formatDate(appointmentData.preference2.dateRangeStart)} - ${formatDate(appointmentData.preference2.dateRangeEnd)}`
          : '',
        slot: appointmentData.preference2.slot,
        // Also keep the individual date fields for validation
        dateRangeStart: appointmentData.preference2.dateRangeStart,
        dateRangeEnd: appointmentData.preference2.dateRangeEnd
      }
    };

    console.log('Appointment data being saved:', formatted);
    onComplete({ appointmentData: formatted });
  };

  return (
    <div className="space-y-6">

      {/* Appointment Information */}
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Appointment for {travelerData?.basicDetails?.firstName}
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            Please give us a few options for your appointment. We may reach out to you for alternate slots, in case, we are unable to book this slot for you.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Preference 1 */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-white mb-4">Preference 1</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <select
                value={appointmentData.preference1.city}
                onChange={(e) => handleInputChange('preference1', 'city', e.target.value)}
                className={`w-full px-3 py-2 bg-[#292933] border text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference1.city ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingCities || disabled}
              >
                <option value="">Select</option>
                {cities.map((city) => (
                  <option key={city.id || city} value={city.name || city}>
                    {city.name || city}
                  </option>
                ))}
              </select>
              {loadingCities && (
                <p className="text-xs text-gray-400 mt-1">Loading cities...</p>
              )}
              {errors.preference1.city && (
                <p className="text-xs text-red-400 mt-1">{errors.preference1.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Available between
              </label>
              <DatePicker
                selectsRange
                startDate={appointmentData.preference1.dateRangeStart}
                endDate={appointmentData.preference1.dateRangeEnd}
                onChange={(dates) => handleDateRangeChange('preference1', dates)}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date range"
                className={`w-full px-3 py-2 bg-[#292933] border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference1.dateRange ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={disabled}
              />
              {errors.preference1.dateRange && (
                <p className="text-xs text-red-400 mt-1">{errors.preference1.dateRange}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slot
              </label>
              <select
                value={appointmentData.preference1.slot}
                onChange={(e) => handleInputChange('preference1', 'slot', e.target.value)}
                className={`w-full px-3 py-2 bg-[#292933] border text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference1.slot ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingSlots || disabled}
              >
                <option value="">Select</option>
                {slots.map((slot) => (
                  <option key={slot.id || slot} value={slot.time || slot}>
                    {slot.time || slot}
                  </option>
                ))}
              </select>
              {loadingSlots && (
                <p className="text-xs text-gray-400 mt-1">Loading slots...</p>
              )}
              {errors.preference1.slot && (
                <p className="text-xs text-red-400 mt-1">{errors.preference1.slot}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preference 2 */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-white mb-2">
            Preference 2 <span className="text-sm font-normal text-gray-400">(Optional)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <select
                value={appointmentData.preference2.city}
                onChange={(e) => handleInputChange('preference2', 'city', e.target.value)}
                className={`w-full px-3 py-2 bg-[#292933] border text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference2.city ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingCities || disabled}
              >
                <option value="">Select</option>
                {cities.map((city) => (
                  <option key={city.id || city} value={city.name || city}>
                    {city.name || city}
                  </option>
                ))}
              </select>
              {errors.preference2.city && (
                <p className="text-xs text-red-400 mt-1">{errors.preference2.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Available between
              </label>
              <DatePicker
                selectsRange
                startDate={appointmentData.preference2.dateRangeStart}
                endDate={appointmentData.preference2.dateRangeEnd}
                onChange={(dates) => handleDateRangeChange('preference2', dates)}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date range (optional)"
                className={`w-full px-3 py-2 bg-[#292933] border text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference2.dateRange ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={disabled}
              />
              {errors.preference2.dateRange && (
                <p className="text-xs text-red-400 mt-1">{errors.preference2.dateRange}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slot
              </label>
              <select
                value={appointmentData.preference2.slot}
                onChange={(e) => handleInputChange('preference2', 'slot', e.target.value)}
                className={`w-full px-3 py-2 bg-[#292933] border text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.preference2.slot ? 'border-red-500' : 'border-[#423577]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loadingSlots || disabled}
              >
                <option value="">Select</option>
                {slots.map((slot) => (
                  <option key={slot.id || slot} value={slot.time || slot}>
                    {slot.time || slot}
                  </option>
                ))}
              </select>
              {errors.preference2.slot && (
                <p className="text-xs text-red-400 mt-1">{errors.preference2.slot}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
      
          <button
            onClick={handleSave}
            disabled={loading || disabled}
            className="px-6 py-2 bg-[#7350FF] text-white rounded-md hover:bg-[#7350FF]/90 disabled:bg-[#7350FF]/30 transition-colors"
          >
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;