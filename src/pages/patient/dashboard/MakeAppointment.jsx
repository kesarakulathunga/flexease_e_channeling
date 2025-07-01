// src/pages/patient/dashboard/MakeAppointment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MakeAppointment.css';
import appointmentService from '../../../services/appointmentService';

export default function MakeAppointment() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState(''); // '' = not selected, 'now' or 'later'

  // Generate 5 consecutive dates starting from "today" in IST (UTC+5:30)
  const generateDefaultDates = () => {
    const now = new Date();
    const istOffsetMinutes = 330; // +5:30
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istNow = new Date(utc + istOffsetMinutes * 60000);

    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(istNow);
      d.setDate(istNow.getDate() + i);
      dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }
    return dates;
  };  const defaultTimes = [
    '09:30', '11:00', '12:30', '14:00',
    '15:30', '17:00', '18:30', '20:00'
  ];

  const [selectedSlot, setSelectedSlot] = useState(null);  // single selected slot
  const [myExistingAppointment, setMyExistingAppointment] = useState(null); // patient's existing appointment
  const [availableSlots, setAvailableSlots] = useState([]); // slots available for booking
  const [reservedSlots, setReservedSlots] = useState([]); // slots booked by others
  const [dates, setDates] = useState(generateDefaultDates());  // dates start from today
  const [times, setTimes] = useState(defaultTimes);       // times from defaults
  const [loading, setLoading] = useState(false);          // loading state
  const [booking, setBooking] = useState(false);          // booking state
  const [error, setError] = useState('');                 // error message
  const [successMsg, setSuccessMsg] = useState('');       // success message
  const [gridData, setGridData] = useState(null);         // grid data from API
  const [isRescheduling, setIsRescheduling] = useState(false); // whether patient is rescheduling
  const midnightTimeout = useRef();

  // Update CSS variable when dates change - use 3 dates for patient booking
  useEffect(() => {
    document.documentElement.style.setProperty('--num-dates', 3); // Always 3 dates for patient booking
  }, [dates]);

  // Reload grid at next IST midnight
  useEffect(() => {
    const scheduleMidnight = () => {
      const now = new Date();
      const istOffset = 330;
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const istNow = new Date(utcNow + istOffset * 60000);
      const nextMid = new Date(istNow);
      nextMid.setHours(24, 0, 0, 0);
      const ms = nextMid - istNow;
      midnightTimeout.current = setTimeout(() => {
        const newDates = generateDefaultDates();
        setDates(newDates);
        loadTimeSlots();
        scheduleMidnight();
      }, ms);
    };
    scheduleMidnight();
    return () => clearTimeout(midnightTimeout.current);
  }, []);

  // Load available time slots from the API
  const loadTimeSlots = async () => {
    setLoading(true);
    setError('');
    setSelectedSlot(null);

    try {
      // Call the API with IST dates
      const params = { startDate: dates[0], endDate: dates[4] };
      const response = await appointmentService.getAvailableSlotsGrid(params);

      // Get the response data (could be directly in response or in response.data)
      const responseData = response.data || response;

      console.log('Response data:', responseData);

      // Check if the response has the expected structure
      if (!responseData || responseData.success === false) {
        throw new Error(responseData?.message || 'Failed to load available slots');
      }

      // The API is returning the grid data directly in the response, not nested under a data property
      const gridData = responseData;

      // Store the grid data for later use
      setGridData(gridData);

      // Update dates and times from the API if provided
      // If the API doesn't provide dates or they're empty, keep using our generated dates
      if (gridData.dates && gridData.dates.length > 0) {
        setDates(gridData.dates.map(d => d.date));
      } else {
        console.log('Using generated dates since API returned empty dates array');
        // Keep the dates we generated
      }

      // If the API doesn't provide times or they're empty, keep using our default times
      if (gridData.times && gridData.times.length > 0) {
        setTimes(gridData.times.map(t => t.time));
      } else {
        console.log('Using default times since API returned empty times array');
        // Keep the default times
      }

      // Process the grid data
      const availableSlotsList = [];
      const reservedSlotsList = [];
      let existingAppointment = null;

      // Process the grid data to extract available and reserved slots
      // The grid might be empty but that's valid (no slots available)
      if (gridData.grid === undefined || gridData.grid === null) {
        console.error('Grid data missing grid property:', gridData);
        throw new Error('Invalid grid data format from server');
      }

      // If grid is empty, we'll just use an empty object
      const grid = gridData.grid || {};

      try {
        Object.entries(grid).forEach(([date, timeSlots]) => {
          if (!timeSlots) return; // Skip if timeSlots is undefined

          Object.entries(timeSlots).forEach(([time, slotData]) => {
            if (!slotData) return; // Skip if slotData is undefined

            if (slotData.available && !slotData.booked) {
              // Available slot
              availableSlotsList.push({
                date,
                time,
                timeSlotId: slotData.timeSlotId || null,
                adminCount: slotData.adminCount || 0
              });
            } else if (slotData.booked && slotData.myBooking) {
              // My existing appointment
              existingAppointment = {
                date,
                time,
                timeSlotId: slotData.timeSlotId || null,
                appointmentId: slotData.appointmentId || null,
                status: slotData.status || 'UNKNOWN'
              };
              // Set as selected slot initially
              setSelectedSlot({
                date,
                time,
                timeSlotId: slotData.timeSlotId || null,
                appointmentId: slotData.appointmentId || null
              });
              setIsRescheduling(true);
            } else if (slotData.booked && !slotData.myBooking) {
              // Reserved by someone else
              reservedSlotsList.push({
                date,
                time,
                timeSlotId: slotData.timeSlotId || null
              });
            }
          });
        });
      } catch (gridError) {
        console.error('Error processing grid data:', gridError);
        throw new Error('Failed to process appointment data');
      }

      // Set the state variables
      setAvailableSlots(availableSlotsList);
      setReservedSlots(reservedSlotsList);
      setMyExistingAppointment(existingAppointment);

      // If patient has an existing appointment, set payment method to their previous choice
      if (existingAppointment) {
        // For demo, we'll default to 'now' - in a real app, you'd get this from the API
        setPaymentMethod('now');
      }

    } catch (err) {
      console.error('Error loading time slots:', err);
      setError('Failed to load available appointment slots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // On mount: load available slots
  useEffect(() => {
    loadTimeSlots();
  }, []);

  // Function to manually refresh data
  const handleRefresh = () => {
    setSuccessMsg('');
    loadTimeSlots();
  };
    const handleBooking = async () => {
    // Don't proceed if no slot is selected
    if (!selectedSlot) {
      setError('Please select an appointment slot');
      return;
    }

    // Don't proceed if no payment method is selected (for new appointments)
    if (!isRescheduling && !paymentMethod) {
      setError('Please select a payment method before booking');
      return;
    }

    setBooking(true);
    setError('');
    setSuccessMsg('');

    try {
      // Format the data according to the API requirements
      const requestData = {
        selectedSlots: [{ timeSlotId: selectedSlot.timeSlotId }]
      };

      // Call the API to update appointments
      const response = await appointmentService.updateAppointments(requestData);

      // Get the response data (could be directly in response or in response.data)
      const responseData = response.data || response;

      if (!responseData.success) {
        // Check if there are unavailable slots
        if (responseData.unavailableSlots && responseData.unavailableSlots.length > 0) {
          const unavailableSlot = responseData.unavailableSlots[0];
          throw new Error(`Selected slot is no longer available: ${unavailableSlot.reason}`);
        }
        throw new Error(responseData.message || 'Failed to book appointment');
      }

      // Create success message based on the response
      let bookingMessage;

      if (isRescheduling) {
        bookingMessage = `Appointment rescheduled successfully! ${responseData.booked} booked, ${responseData.canceled} canceled.`;
        // Remove the payment redirection message for rescheduling
      } else {
        bookingMessage = paymentMethod === 'now'
          ? 'Appointment booked successfully! Your receipt has been opened in a new tab. Payment details will be collected at your appointment.'
          : 'Appointment booked successfully! Your receipt has been opened in a new tab. Payment will be collected at the time of appointment.';
      }

      setSuccessMsg(bookingMessage);

      // Store appointment data for receipt generation
      const appointmentData = {
        date: selectedSlot.date,
        time: selectedSlot.time,
        paymentMethod: paymentMethod
      };

      // Save to localStorage as a backup
      localStorage.setItem('lastAppointment', JSON.stringify(appointmentData));

      // Open receipt in new tab with state
      const receiptUrl = `/appointment-receipt?date=${encodeURIComponent(selectedSlot.date)}&time=${encodeURIComponent(selectedSlot.time)}&payment=${encodeURIComponent(paymentMethod)}`;
      const receiptWindow = window.open(receiptUrl, '_blank');

      // Show a message that the form will be reset
      setTimeout(() => {
        setSuccessMsg(prev => prev + ' Form will reset in a few seconds...');
      }, 3000);

      // Reset the form and reload time slots after 5 seconds
      setTimeout(() => {
        // Set loading state to show visual feedback
        setLoading(true);

        // Clear success message
        setSuccessMsg('');

        // Reset selected slot and payment method
        setSelectedSlot(null);
        if (!isRescheduling) {
          setPaymentMethod('');
        }

        // Reload time slots to refresh the data
        loadTimeSlots();
      }, 5000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again later.');
    } finally {
      setBooking(false);
    }
  };
  const toggleSlot = (date, time) => {
    console.log(`toggleSlot called with: date=${date}, time=${time}`);
    console.log('Current dates array:', dates);
    console.log('Available slots:', availableSlots);

    // If reserved by someone else, do nothing
    if (reservedSlots.some(s => s.date === date && s.time === time)) return;

    // Find the timeSlotId for this date and time from the grid data
    const findSlotData = () => {
      if (gridData && gridData.grid && gridData.grid[date] && gridData.grid[date][time]) {
        const slotData = gridData.grid[date][time];
        return {
          date,
          time,
          timeSlotId: slotData.timeSlotId,
          appointmentId: slotData.appointmentId,
          available: slotData.available,
          booked: slotData.booked,
          myBooking: slotData.myBooking
        };
      }

      // If not found in grid data, check if it's the existing appointment
      if (myExistingAppointment && myExistingAppointment.date === date && myExistingAppointment.time === time) {
        return myExistingAppointment;
      }

      // If still not found, check available slots
      const availableSlot = availableSlots.find(s => s.date === date && s.time === time);
      if (availableSlot) {
        return availableSlot;
      }

      // If still not found, log an error and return basic data
      console.error(`Could not find complete slot data for date ${date} and time ${time}`);
      return { date, time };
    };

    // Get the slot data
    const slotData = findSlotData();

    // Check if this is the currently selected slot
    const isCurrentlySelected = selectedSlot &&
                               selectedSlot.date === date &&
                               selectedSlot.time === time;

    // If it's the currently selected slot, deselect it
    if (isCurrentlySelected) {
      setSelectedSlot(null);
      setError(''); // Clear any errors
      return;
    }

    // Otherwise, select this slot (replacing any previously selected slot)
    console.log('Setting selected slot to:', slotData);
    setSelectedSlot(slotData);
    setError(''); // Clear any errors
  };

  const isSelected = (date, time) =>
    selectedSlot && selectedSlot.date === date && selectedSlot.time === time;

  const isMyExistingAppointment = (date, time) =>
    myExistingAppointment && myExistingAppointment.date === date && myExistingAppointment.time === time;

  const isReserved = (date, time) =>
    reservedSlots.some(s => s.date === date && s.time === time);

  const isAvailable = (date, time) =>
    availableSlots.some(s => s.date === date && s.time === time);

  if (loading) {
    return <div className="loading">Loading available appointment slots...</div>;
  }
  return (
    <div className="update-slots-page">
      <div className="page-header">
        <div>
          <h2>Book an Appointment</h2>
          <p className="admin-note">
            Select an available time slot from the calendar.
            We suggest you to upload the generated reports before visit for the appointment.
            <span className="slot-count-indicator">
              {selectedSlot ? '(1 slot selected)' : '(0 slots selected)'}
            </span>
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={loading || booking}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      <div className="appointment-form">

      <div className="info-message">
        <p><strong>Timezone:</strong> All dates and times are in Indian Standard Time (IST / UTC+5:30)</p>
        <p><strong>Booking Policy:</strong> Same-day appointments are not available. Please book at least 1 day in advance.</p>
      </div>

      {error ? (
        <div className="error-message">
          <p>{error}</p>
          <p>Please try again later or contact our office directly.</p>
        </div>
      ) : (
        <>
          {availableSlots.length === 0 && reservedSlots.length === 0 && !myExistingAppointment && (
            <div className="no-slots-message">
              <p>No appointment slots available in the next 5 days.</p>
              <p>Please check back later or contact our office directly.</p>
            </div>
          )}

          <div className="grid-container">
            <div className="grid-header slot-header"></div>
            {dates.slice(0, 3).map(d => <div key={d} className="grid-header">{d}</div>)}

            {times.map(t => (
              <React.Fragment key={t}>
                <div className="grid-header">{t}</div>
                {dates.slice(0, 3).map((d, dateIndex) => {
                  const selected = isSelected(d, t);
                  const reserved = isReserved(d, t);
                  const myAppointment = isMyExistingAppointment(d, t);
                  const available = isAvailable(d, t);

                  // Check if this is the first date (same day) - disable booking but allow viewing
                  const isSameDay = dateIndex === 0;

                  // If there are no available slots at all, show all slots as unavailable
                  const noSlotsAvailable = availableSlots.length === 0 && reservedSlots.length === 0 && !myExistingAppointment;

                  // Determine the cell class
                  let cellClass = 'slot-cell';
                  if (noSlotsAvailable) cellClass += ' unavailable';
                  else if (isSameDay && !myAppointment && !reserved) cellClass += ' same-day-disabled'; // New class for same-day slots
                  else if (reserved) cellClass += ' reserved';
                  else if (selected) cellClass += ' selected';
                  else if (myAppointment) cellClass += ' my-appointment';
                  else if (!available) cellClass += ' unavailable';

                  // Determine if the slot should be clickable
                  const isClickable = !noSlotsAvailable && !reserved && available && !isSameDay;

                  return (
                    <div
                      key={`${d}|${t}`}
                      className={cellClass}
                      onClick={() => {
                        console.log(`Clicked: Date=${d}, Time=${t}, DateIndex=${dateIndex}`);
                        return isClickable ? toggleSlot(d, t) : null;
                      }}
                      title={
                        noSlotsAvailable ? 'No slots available' :
                        isSameDay && !myAppointment && !reserved ? 'Same-day booking not available. Please book at least 1 day in advance.' :
                        reserved ? 'This slot is already booked' :
                        myAppointment ? 'Your current appointment' :
                        available ? 'Available for booking' : 'Not available'
                      }
                    >
                      {noSlotsAvailable ? '🔒' :
                       isSameDay && !myAppointment && !reserved ? '⏰' :
                       reserved ? '🔒' :
                       myAppointment ? '👤' :
                       selected ? '✓' : ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <section className="selected-slots">
            <h3>
              {isRescheduling
                ? 'Reschedule Your Appointment'
                : 'Book a New Appointment'}
            </h3>

            {selectedSlot ? (
              <>
                <div className="selected-slot-info">
                  <p>
                    <strong>Selected Time Slot:</strong> {selectedSlot.date} at {selectedSlot.time}
                    <button
                      className="remove-btn"
                      onClick={() => setSelectedSlot(null)}
                    >
                      Remove
                    </button>
                  </p>
                </div>

                {/* Payment Method Selection - disabled for rescheduling */}
                <div className={`payment-method-section ${isRescheduling ? 'disabled' : ''}`}>
                  <h4>Select Payment Method</h4>
                  <div className="payment-options">
                    <div
                      className={`payment-option ${paymentMethod === 'now' ? 'selected' : ''} ${isRescheduling ? 'disabled' : ''}`}
                      onClick={() => !isRescheduling && setPaymentMethod('now')}
                    >
                      <div className="radio-button">
                        {paymentMethod === 'now' && <div className="radio-inner"></div>}
                      </div>
                      <div className="payment-details">
                        <span className="payment-title">Pay Now</span>
                        <span className="payment-description">Proceed to payment immediately</span>
                      </div>
                    </div>

                    <div
                      className={`payment-option ${paymentMethod === 'later' ? 'selected' : ''} ${isRescheduling ? 'disabled' : ''}`}
                      onClick={() => !isRescheduling && setPaymentMethod('later')}
                    >
                      <div className="radio-button">
                        {paymentMethod === 'later' && <div className="radio-inner"></div>}
                      </div>
                      <div className="payment-details">
                        <span className="payment-title">Pay Later</span>
                        <span className="payment-description">Pay at the time of appointment</span>
                      </div>
                    </div>
                  </div>

                  {isRescheduling && (
                    <div className="info-message">
                      <p>Payment method cannot be changed when rescheduling an appointment.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>Please select a time slot from the calendar.</p>
            )}
          </section>

          <div className="actions">
            <button
              className="save-button"
              onClick={handleBooking}
              disabled={booking || !selectedSlot || (!isRescheduling && !paymentMethod)}
            >
              {booking ? (
                <>
                  <span className="spinner"></span>
                  {isRescheduling ? 'Rescheduling...' : 'Booking...'}
                </>
              ) : isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
            </button>

            {selectedSlot && !isRescheduling && !paymentMethod && (
              <div className="payment-selection-notice">
                Please select a payment method to continue
              </div>
            )}          </div>
        </>
      )}
      </div> {/* Closing div for appointment-form */}
    </div>
  );
}
