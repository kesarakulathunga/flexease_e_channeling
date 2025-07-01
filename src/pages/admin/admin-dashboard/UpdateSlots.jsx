import React, { useState, useEffect, useRef } from 'react';
import './UpdateSlots.css';
import adminService from '../../../services/adminService';
import api from '../../../services/api';

// Generates an array of 5 dates starting from "today" in IST (UTC+5:30)
function generateDates() {
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
}

export default function UpdateSlots() {
  const [dates, setDates] = useState(generateDates());
  const times = [
    '09:30', '11:00', '12:30', '14:00',
    '15:30', '17:00', '18:30', '20:00'
  ];
  const [availSlots, setAvailSlots] = useState([]);
  const [reservedSlots, setReservedSlots] = useState([]);
  const [originalMarkedSlots, setOriginalMarkedSlots] = useState([]); // Track original API response
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const midnightTimeout = useRef();

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
        const newDates = generateDates();
        setDates(newDates);
        loadSlots(newDates);
        scheduleMidnight();
      }, ms);
    };
    scheduleMidnight();
    return () => clearTimeout(midnightTimeout.current);
  }, []);

  // Fetch availability & bookings
  async function loadSlots(useDates = dates) {
    setLoading(true);
    setMessage(''); // Clear any previous messages
    try {
      // Check if user is authenticated with a valid token
      const token = api.getValidToken();
      if (!token) {
        setMessage('Authentication required. Please login again.');
        console.error('No valid authentication token available');
        return;
      }

      const params = { startDate: useDates[0], endDate: useDates[4] };
      console.log('Loading slots with date range:', params);

      const res = await adminService.getMarkedAvailability(params);

      // Process the new response format
      // Get the response data (could be directly in response or in response.data)
      const responseData = res.data || res;
      const markedSlots = responseData.markedSlots || [];

      // Store the original marked slots for reference
      setOriginalMarkedSlots(markedSlots);

      console.log(`Loaded ${markedSlots.length} slots (${markedSlots.filter(s => !s.isBooked).length} available, ${markedSlots.filter(s => s.isBooked).length} booked)`);

      // Set available slots (not booked)
      setAvailSlots(
        markedSlots
          .filter(s => !s.isBooked)
          .map(s => ({ date: s.date, time: s.time }))
      );

      // Set reserved slots (booked)
      setReservedSlots(
        markedSlots
          .filter(s => s.isBooked)
          .map(s => ({ date: s.date, time: s.time }))
      );
    } catch (err) {
      console.error('Error loading slots', err);

      // Handle specific error cases
      if (err.message && typeof err.message === 'string') {
        // Use the error message from the service if available
        setMessage(err.message);
      } else if (err.response?.status === 401) {
        setMessage('Your session has expired. Please login again.');
      } else if (err.response?.status === 403) {
        setMessage('You do not have permission to access this resource.');
      } else if (err.response?.status === 404) {
        setMessage('The requested resource was not found. Please contact support.');
      } else if (err.response?.status >= 500) {
        setMessage('Server error. Please try again later or contact support.');
      } else {
        setMessage('Failed to load time slots. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Load on mount and whenever dates change
  useEffect(() => { loadSlots(); }, [dates]);

  // Toggle a slot in availSlots
  function toggleSlot(date, time) {
    // Clear any previous messages
    setMessage('');

    // Check if this slot is currently booked (reserved)
    const isCurrentlyBooked = reservedSlots.some(s => s.date === date && s.time === time);

    if (isCurrentlyBooked) {
      // Don't allow toggling booked slots
      setMessage('Cannot modify booked slots. This slot is already booked by a patient. To make it available, the booking must be cancelled first.');
      return;
    }

    // Toggle the slot in availSlots
    setAvailSlots(prev => {
      const exists = prev.some(s => s.date === date && s.time === time);
      if (exists) {
        // Remove it from available slots
        return prev.filter(s => !(s.date === date && s.time === time));
      } else {
        // Add it to available slots
        return [...prev, { date, time }];
      }
    });
  }

  // Save the full current availSlots array using POST /api/admin/availability/update endpoint
  // This is the only endpoint that should be used for updating admin timeslots
  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      // Check if user is authenticated with a valid token
      const token = api.getValidToken();
      if (!token) {
        setMessage('Authentication required. Please login again.');
        console.error('No valid authentication token available');
        return;
      }

      // Validate data before sending
      if (!availSlots || !Array.isArray(availSlots) || availSlots.length === 0) {
        setMessage('No slots selected. Please select at least one time slot.');
        return;
      }

      // Get the current state of available slots (user selections)
      const userSelectedSlots = availSlots.map(slot => ({
        date: slot.date,
        time: slot.time
      }));

      // Get all existing booked slots that should be preserved
      const existingBookedSlots = originalMarkedSlots
        .filter(slot => slot.isBooked)
        .map(slot => ({
          date: slot.date,
          time: slot.time
        }));

      // Combine user selections with existing booked slots
      // This ensures we don't accidentally "remove" booked slots
      const allSlotsToSend = [
        ...userSelectedSlots,
        ...existingBookedSlots
      ];

      // Remove duplicates (in case user selected a slot that's already booked)
      const currentAvailableSlots = allSlotsToSend.filter((slot, index, self) =>
        index === self.findIndex(s => s.date === slot.date && s.time === slot.time)
      );

      // Get the original state of available (non-booked) slots
      const originalAvailableSlots = originalMarkedSlots
        .filter(slot => !slot.isBooked)
        .map(slot => ({
          date: slot.date,
          time: slot.time
        }));

      // Validate that we're not trying to make booked slots available
      // Only check the user-selected slots, not the combined list (which includes preserved booked slots)
      const bookedSlots = originalMarkedSlots.filter(slot => slot.isBooked);

      // Check if any of the USER SELECTED slots are currently booked
      const conflictingSlots = userSelectedSlots.filter(userSlot => {
        return bookedSlots.some(bookedSlot =>
          bookedSlot.date === userSlot.date && bookedSlot.time === userSlot.time
        );
      });

      if (conflictingSlots.length > 0) {
        let conflictMessage = 'Cannot make booked slots available. The following slots are currently booked:';
        conflictingSlots.forEach(slot => {
          conflictMessage += `\n- ${slot.date} at ${slot.time}`;
        });
        conflictMessage += '\n\nTo make these slots available, the bookings must be cancelled first.';

        setMessage(conflictMessage);
        setSaving(false);
        return;
      }

      // Format data according to the new API requirements
      const requestData = {
        selectedSlots: currentAvailableSlots
      };

      // Debug logging
      console.log('=== SAVE SLOTS DEBUG ===');
      console.log('Original marked slots:', originalMarkedSlots);
      console.log('User selected slots (availSlots):', userSelectedSlots);
      console.log('Existing booked slots:', existingBookedSlots);
      console.log('Combined slots to send:', currentAvailableSlots);
      console.log('Reserved slots:', reservedSlots);
      console.log(`Saving ${requestData.selectedSlots.length} total slots`);
      console.log('Request data:', requestData);

      // Use the POST /api/admin/availability/update endpoint
      const response = await adminService.updateAvailability(requestData);

      // The response is already standardized in the service
      console.log('Update response:', response);

      // Display success message from the response
      setMessage(response.message || `Successfully updated: ${response.added} slots added, ${response.removed} slots removed`);

      // Log additional details if available
      if (response.addedSlots && response.addedSlots.length > 0) {
        console.log('Added slots:', response.addedSlots);
      }

      // Reload slots to reflect the latest changes
      loadSlots();
    } catch (err) {
      console.error('Error saving slots', err);

      // Handle specific error cases
      if (err.isConflictError) {
        // Handle the conflict error (409) - trying to remove booked slots
        const conflicts = err.conflicts || [];

        // Create a more helpful message that shows which slots are causing conflicts
        let conflictMessage = err.message || 'Cannot remove slots that are already booked.';

        if (conflicts.length > 0) {
          conflictMessage += ' The following slots are already booked:';

          // Add the first 3 conflicts to the message (to avoid very long messages)
          const maxConflictsToShow = Math.min(3, conflicts.length);
          for (let i = 0; i < maxConflictsToShow; i++) {
            const conflict = conflicts[i];
            conflictMessage += `\n- ${conflict.date} at ${conflict.time}`;
          }

          // If there are more conflicts, indicate that
          if (conflicts.length > maxConflictsToShow) {
            conflictMessage += `\n- ...and ${conflicts.length - maxConflictsToShow} more`;
          }

          conflictMessage += '\n\nPlease reload the page to see the current state.';
        }

        setMessage(conflictMessage);

        // Highlight the conflicting slots in the UI by reloading
        loadSlots();
      } else if (err.message && typeof err.message === 'string') {
        // Use the error message from the service if available
        setMessage(err.message);
      } else if (err.response?.status === 401) {
        setMessage('Your session has expired. Please login again.');
      } else if (err.response?.status === 403) {
        setMessage('You do not have permission to access this resource.');
      } else if (err.response?.status === 400) {
        setMessage(err.response.data?.message || 'Invalid data format. Please check your selections.');
      } else if (err.response?.status === 409) {
        // Fallback for 409 errors that weren't caught by the service
        setMessage(err.response.data?.message || 'Cannot update slots due to conflicts. Some slots may already be booked.');
        loadSlots(); // Reload to show current state
      } else if (err.response?.status >= 500) {
        setMessage('Server error. Please try again later or contact support.');
      } else {
        setMessage('Failed to save slots. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading time slots...</p>
      </div>
    );
  }
    return (
    <div className="update-slots-page">
      <div className="page-header">
        <div>
          <h2>Update Available Time Slots</h2>
          <p className="admin-note">These slots are visible to all administrators</p>
        </div>
        <button
          className="refresh-button"
          onClick={() => loadSlots()}
          disabled={loading || saving}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {message && <div className={message.includes('Failed') ? "error-message" : "success-message"}>{message}</div>}

      <div className="info-message">
        <p><strong>Timezone:</strong> All dates and times are in Indian Standard Time (IST / UTC+5:30)</p>
        <p><strong>Booked Slots:</strong> Slots marked with 🔒 are already booked by patients and cannot be modified.</p>
      </div>

      <div className="grid-container">
        <div className="grid-header slot-header"></div>
        {dates.map(d => <div key={d} className="grid-header">{d}</div>)}

        {times.map(t => (
          <React.Fragment key={t}>
            <div className="grid-header">{t}</div>
            {dates.map(d => {
              const selected = availSlots.some(s => s.date === d && s.time === t);
              const reserved = reservedSlots.some(s => s.date === d && s.time === t);

              // Determine if this slot was originally booked
              const wasBooked = originalMarkedSlots.some(
                s => s.date === d && s.time === t && s.isBooked
              );

              return (
                <div
                  key={`${d}|${t}`}
                  className={`slot-cell ${reserved ? 'reserved' : selected ? 'selected' : ''}`}
                  onClick={() => toggleSlot(d, t)}
                  title={reserved ? 'This slot is booked by a patient and cannot be modified' :
                         wasBooked ? 'This slot was booked but is now available' :
                         selected ? 'Click to unmark as available' : 'Click to mark as available'}
                >
                  {reserved ? '🔒' : selected ? '✓' : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="actions">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
