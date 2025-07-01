# Simplified Admin Availability API

This document explains how to use the new simplified admin availability API.

## Updating Availability

### API Endpoint

```
POST /api/admin/slots/availability/simplified
```

### Request Format

The API accepts a JSON payload with a simple array of slots:

```json
{
  "slots": [
    { "date": "2025-05-18", "time": "08:00" },
    { "date": "2025-05-18", "time": "09:00" },
    { "date": "2025-05-19", "time": "14:00" }
  ]
}
```

### Request Parameters

- `date`: (Required) Date in YYYY-MM-DD format
- `time`: (Required) Time in HH:MM format (24-hour)

## Response Format

The API returns a JSON response with information about the success of the operation:

```json
{
  "success": true,
  "message": "Successfully updated availability for 3 time slots",
  "updatedCount": 3,
  "totalRequested": 3,
  "skippedCount": 0
}
```

### Response Fields

- `success`: Boolean indicating if the request was processed successfully
- `message`: A human-readable message describing the result
- `updatedCount`: Number of time slots successfully marked as available
- `totalRequested`: Total number of slots requested in the input
- `skippedCount`: Number of slots that were skipped (due to being locked or having appointments)

## Error Responses

### Invalid Request Format

```json
{
  "success": false,
  "error": "Must provide an array of slots with date and time"
}
```

### Invalid Slot Data

```json
{
  "success": false,
  "error": "Some slots have invalid data",
  "invalidSlots": [
    {
      "index": 0,
      "slot": { "date": "invalid-date", "time": "08:00" },
      "reason": "Invalid date format, expected YYYY-MM-DD"
    }
  ]
}
```

## Example Usage

```javascript
const axios = require('axios');

const adminToken = 'YOUR_ADMIN_TOKEN';
const slots = [
  { date: '2025-05-18', time: '08:00' },
  { date: '2025-05-18', time: '09:00' },
  { date: '2025-05-19', time: '14:00' }
];

axios.post(
  'http://localhost:4000/api/admin/slots/availability/simplified',
  { slots },
  { 
    headers: { 
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    } 
  }
)
.then(response => console.log(response.data))
.catch(error => console.error(error.response.data));
```

## Fetching Availability

### API Endpoint

```
GET /api/admin/slots/availability
```

### Query Parameters

- `startDate` (Optional): Start date for filtering slots (format: YYYY-MM-DD)
- `endDate` (Optional): End date for filtering slots (format: YYYY-MM-DD)

If `startDate` is not provided, the current date is used as the default.
If `endDate` is not provided, `startDate + 4 days` is used as the default.

Examples:
```
/api/admin/slots/availability
/api/admin/slots/availability?startDate=2025-05-20
/api/admin/slots/availability?startDate=2025-05-20&endDate=2025-05-25
```

### Authentication

Requires a valid admin JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

The API returns a flat list of slots with availability and booking status:

```json
{
  "success": true,
  "slots": [
    { "date": "2025-05-18", "time": "08:00", "available": true, "booked": false },
    { "date": "2025-05-18", "time": "09:00", "available": true, "booked": true },
    { "date": "2025-05-18", "time": "10:00", "available": false, "booked": true },
    // ...more slots...
  ]
}
```

### Response Fields

- `date`: Date in YYYY-MM-DD format
- `time`: Time in 24-hour format (HH:MM)
- `available`: Boolean indicating if this admin has marked this slot as available
- `booked`: Boolean indicating if this slot has been booked by a patient

### Example Usage

```javascript
const axios = require('axios');

const adminToken = 'YOUR_ADMIN_TOKEN';

axios.get(
  'http://localhost:4000/api/admin/slots/availability',
  { 
    headers: { 
      'Authorization': `Bearer ${adminToken}`
    } 
  }
)
.then(response => {
  console.log(response.data.slots);
  
  // Filter for only available slots
  const availableSlots = response.data.slots.filter(slot => slot.available);
  console.log('My available slots:', availableSlots);
  
  // Filter for booked slots
  const bookedSlots = response.data.slots.filter(slot => slot.booked);
  console.log('Booked slots:', bookedSlots);
})
.catch(error => console.error(error.response?.data || error.message));
```

### Example with Date Filtering

```javascript
const axios = require('axios');

const adminToken = 'YOUR_ADMIN_TOKEN';
const startDate = '2025-05-20';
const endDate = '2025-05-25';

axios.get(
  `http://localhost:4000/api/admin/slots/availability?startDate=${startDate}&endDate=${endDate}`,
  { 
    headers: { 
      'Authorization': `Bearer ${adminToken}`
    } 
  }
)
.then(response => {
  console.log(`Slots between ${startDate} and ${endDate}:`, response.data.slots);
})
.catch(error => console.error(error.response?.data || error.message));
```

## Fetching All Admins' Availability

### API Endpoint

```
GET /api/admin/slots/availability/all
```

### Authentication

Requires a valid admin JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

The API returns a comprehensive list of slots with availability information for all admins:

```json
{
  "success": true,
  "slots": [
    {
      "date": "2025-05-18",
      "time": "08:00",
      "timeSlotId": 1,
      "isLocked": false,
      "available": true,
      "booked": false,
      "bookingStatus": null,
      "availableAdmins": [
        {"adminId": 1, "email": "admin1@example.com"},
        {"adminId": 3, "email": "admin3@example.com"}
      ],
      "totalAvailableAdmins": 2
    },
    {
      "date": "2025-05-18",
      "time": "09:00",
      "timeSlotId": 2,
      "isLocked": false,
      "available": false,
      "booked": true,
      "bookingStatus": "CONFIRMED",
      "availableAdmins": [
        {"adminId": 2, "email": "admin2@example.com"}
      ],
      "totalAvailableAdmins": 1
    },
    // ...more slots...
  ]
}
```

### Response Fields

- `date`: Date in YYYY-MM-DD format
- `time`: Time in 24-hour format (HH:MM)
- `timeSlotId`: Database ID of the time slot
- `isLocked`: Whether the slot is locked for booking
- `available`: Boolean indicating if the admin making the request has marked this slot as available
- `booked`: Boolean indicating if this slot has been booked by a patient
- `bookingStatus`: Status of the booking (if any), e.g., "PENDING", "CONFIRMED", etc.
- `availableAdmins`: Array of objects containing adminId and email for each admin who marked this slot as available
- `totalAvailableAdmins`: Count of admins available for this slot

### Example Usage

```javascript
const axios = require('axios');

const adminToken = 'YOUR_ADMIN_TOKEN';

axios.get(
  'http://localhost:4000/api/admin/slots/availability/all',
  { 
    headers: { 
      'Authorization': `Bearer ${adminToken}`
    } 
  }
)
.then(response => {
  console.log(response.data.slots);
  
  // Filter slots with multiple available admins
  const multiAdminSlots = response.data.slots.filter(
    slot => slot.totalAvailableAdmins > 1
  );
  console.log('Slots with multiple admins available:', multiAdminSlots);
  
  // Get all slots for a specific admin
  const admin2Slots = response.data.slots.filter(
    slot => slot.availableAdmins.some(admin => admin.adminId === 2)
  );
  console.log('Admin 2 available slots:', admin2Slots);
})
.catch(error => console.error(error.response?.data || error.message));
```

## Testing

You can use the provided `test-simplified-availability.js` script to test this endpoint:

```
node test-simplified-availability.js YOUR_ADMIN_TOKEN
```
