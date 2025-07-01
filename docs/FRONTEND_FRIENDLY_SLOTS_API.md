# Frontend-Friendly Admin Slots API

This document describes the simplified admin slots API designed to work seamlessly with the frontend implementation.

## GET Availability

### Endpoint

```
GET /api/admin/slots/availability/simple
```

### Query Parameters

- `startDate` (Optional): Start date for the date range in YYYY-MM-DD format
- `endDate` (Optional): End date for the date range in YYYY-MM-DD format

If not provided, these will default to a 5-day window starting from the current date.

### Authentication

Requires admin JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

```json
{
  "success": true,
  "slots": [
    {
      "date": "2025-05-18",
      "time": "09:00",
      "available": true,
      "booked": false
    },
    {
      "date": "2025-05-18", 
      "time": "10:00",
      "available": false,
      "booked": true
    },
    // ... more slots
  ]
}
```

Each slot contains:
- `date`: Date string in YYYY-MM-DD format
- `time`: Time string in HH:MM format (24-hour)
- `available`: Boolean indicating if the admin has marked this slot as available
- `booked`: Boolean indicating if a patient has booked this slot

## UPDATE Availability

### Endpoint

```
PUT /api/admin/slots/availability/simple
```

### Request Body

```json
{
  "slots": [
    { "date": "2025-05-18", "time": "09:00" },
    { "date": "2025-05-18", "time": "10:00" },
    { "date": "2025-05-19", "time": "14:00" }
    // ... more slots
  ]
}
```

#### Time Format Support

The API now supports both 24-hour and 12-hour time formats:

- **24-hour format** (preferred): `"09:00"`, `"14:30"`, `"18:45"`
- **12-hour format** (also supported): `"09:00 AM"`, `"02:30 PM"`, `"06:45 PM"`

This is a complete replacement of the admin's availability. Any slots not included in this list will be removed from the admin's availability.

### Authentication

Requires admin JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

```json
{
  "success": true,
  "message": "Updated availability: 3 added, 2 removed",
  "updated": 3,
  "added": 3,
  "removed": 2
}
```

## Example Usage (JavaScript)

### Getting Availability

```javascript
const axios = require('axios');

const token = 'YOUR_ADMIN_TOKEN';

// Optional date parameters
const startDate = '2025-05-20';
const endDate = '2025-05-25';

// With date parameters
axios.get(
  `http://localhost:4000/api/admin/slots/availability/simple?startDate=${startDate}&endDate=${endDate}`,
  { 
    headers: { 
      'Authorization': `Bearer ${token}`
    } 
  }
)
.then(response => {
  console.log('Available slots:', response.data.slots);
})
.catch(error => console.error(error.response?.data || error.message));

// Without date parameters (uses defaults)
axios.get(
  'http://localhost:4000/api/admin/slots/availability/simple',
  { 
    headers: { 
      'Authorization': `Bearer ${token}`
    } 
  }
)
.then(response => {
  console.log('Available slots:', response.data.slots);
})
.catch(error => console.error(error.response?.data || error.message));
```

### Updating Availability

```javascript
const axios = require('axios');

const token = 'YOUR_ADMIN_TOKEN';

// Create slots for the next 3 days
const slots = [];
const today = new Date();

// Generate sample slots
for (let i = 0; i < 3; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  const dateStr = date.toISOString().slice(0, 10);
  
  // Add time slots (9 AM to 5 PM every 2 hours)
  for (let hour = 9; hour <= 17; hour += 2) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({ date: dateStr, time: timeStr });
  }
}

axios.put(
  'http://localhost:4000/api/admin/slots/availability/simple',
  { slots },
  { 
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } 
  }
)
.then(response => {
  console.log('Update response:', response.data);
})
.catch(error => console.error(error.response?.data || error.message));
```

## Testing

You can use the included test script to try these endpoints:

```bash
# Get all slots with default date range
node test-admin-slots-simplified.js YOUR_ADMIN_TOKEN get

# Update slots with new availability
node test-admin-slots-simplified.js YOUR_ADMIN_TOKEN update
```
