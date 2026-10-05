# RentalGo API Reference

All API routes are Next.js App Router Route Handlers under `app/api`.

## Authentication

### `POST /api/auth/register`
Creates a normal customer account, hashes the password, creates a signed session, and sets the HttpOnly session cookie.

Body:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "strong-password"
}
```

### `POST /api/auth/login`
Checks the stored bcrypt hash and sets a signed session cookie.

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### `POST /api/auth/logout`
Expires the session cookie.

### `GET /api/auth/me`
Returns the currently authenticated user or `null`.

## Cars

### `GET /api/cars`
Public inventory/search endpoint.

Supported query parameters:

- `q`
- `pickup`
- `dropoff`
- `pickupDate=YYYY-MM-DD`
- `returnDate=YYYY-MM-DD`
- `type`
- `transmission`
- `fuel`
- `seats`
- `minPrice`
- `maxPrice`

If both dates are provided, cars with overlapping `PENDING` or `CONFIRMED` bookings are excluded.

`includeInactive=1` is honored only for authenticated administrators.

### `POST /api/cars`
Admin only. Creates a car and its supported locations.

Example:

```json
{
  "name": "Hyundai Creta",
  "brand": "Hyundai",
  "type": "SUV",
  "image": "/creta.png",
  "pricePerDay": 5000,
  "rating": 4.6,
  "reviews": 120,
  "seats": 5,
  "transmission": "Automatic",
  "fuel": "Petrol",
  "locations": ["Mumbai", "Pune"],
  "active": true
}
```

### `GET /api/cars/:id`
Returns one active car.

### `PATCH /api/cars/:id`
Admin only. Updates car details and/or locations.

### `DELETE /api/cars/:id`
Admin only. Soft-deletes the car by marking it inactive. Existing booking history is preserved.

## Bookings

### `GET /api/bookings`
Requires authentication.

- Normal users receive only their own bookings.
- Administrators receive all bookings.
- Administrators can use `?scope=mine` to receive only their own bookings.

### `POST /api/bookings`
Requires authentication. Creates a persisted booking only if:

- the car exists and is active,
- both selected locations are supported by the car,
- pickup is not in the past,
- the return date is not before pickup,
- no active booking overlaps the requested dates.

Example:

```json
{
  "carId": 2,
  "pickupLocation": "Mumbai",
  "dropoffLocation": "Pune",
  "pickupDate": "2026-09-15",
  "returnDate": "2026-09-18"
}
```

### `PATCH /api/bookings/:id`
Authenticated users may cancel their own active bookings. Administrators may set:

- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`

Example:

```json
{
  "status": "CANCELLED"
}
```

## Admin

### `GET /api/admin/stats`
Admin only. Returns customer count, car count, active cars, total bookings, active bookings, and booked revenue.
