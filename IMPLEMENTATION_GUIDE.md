# RentalGo Full-Stack Implementation Guide

This guide starts from the ZIP and takes the project through installation, database creation, authentication, searching, booking, customer dashboard, and admin dashboard.

---

## 1. What was changed

The original project was a static HTML/CSS website. The new architecture is:

```text
Browser / React UI
        |
        v
Next.js App Router
        |
        +--> Authentication Route Handlers
        +--> Cars Route Handlers
        +--> Bookings Route Handlers
        +--> Admin Route Handlers
        |
        v
Prisma ORM
        |
        v
SQLite database (prisma/dev.db)
```

The customer flow is now:

```text
Register / Login
      |
      v
Search database inventory
      |
      v
Check locations + date availability
      |
      v
Create persisted booking
      |
      v
Customer dashboard
      |
      +--> View bookings
      +--> Cancel booking
```

The administrator flow is:

```text
Admin login
    |
    v
/admin
    |
    +--> View statistics
    +--> Create cars
    +--> Edit cars
    +--> Activate/archive cars
    +--> View every booking
    +--> Change booking status
```

---

## 2. Requirements

Use Node.js **20.19 or newer**. Node 22 LTS/newer is a good local choice.

Check:

```bash
node -v
npm -v
```

You do not need MySQL, MongoDB, or PostgreSQL for this local version. SQLite is a file database.

---

## 3. Extract and open the project

Extract `car-rental-fullstack.zip`.

Open the extracted `car-rental-fullstack` folder in VS Code.

In the VS Code terminal:

```bash
cd car-rental-fullstack
```

If you opened VS Code directly inside the folder, you are already there.

---

## 4. Create the environment file

### macOS / Linux

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Open `.env`.

It should contain:

```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="replace-this-with-a-long-random-secret-at-least-32-characters"
```

Generate a better secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the output and replace the `AUTH_SECRET` value.

Do not expose the production secret in GitHub.

---

## 5. Install dependencies

```bash
npm install
```

Important packages are:

```text
next / react / react-dom       -> web application
prisma                         -> database CLI
@prisma/client                 -> generated database client support
@prisma/adapter-better-sqlite3 -> SQLite adapter
bcryptjs                       -> password hashing
jose                           -> signed JWT session token
```

---

## 6. Create and seed the database

Run:

```bash
npm run db:setup
```

This executes:

```text
prisma generate
       |
       v
prisma db push
       |
       v
prisma db seed
```

After this, `prisma/dev.db` contains tables and initial data.

Test the database:

```bash
npm run db:test
```

You should see counts for users, cars, and bookings.

To inspect the database visually:

```bash
npm run db:studio
```

---

## 7. Start the project

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Stop the server with `Ctrl + C`.

For a production-style local check:

```bash
npm run build
npm start
```

---

## 8. Demo accounts

The seed script creates two accounts.

### Administrator

```text
Email:    admin@rentalgo.local
Password: Admin@12345
```

### Customer

```text
Email:    user@rentalgo.local
Password: User@12345
```

These are demo credentials. Change/remove them before a public deployment.

---

## 9. Authentication: how it works

Files:

```text
app/api/auth/register/route.js
app/api/auth/login/route.js
app/api/auth/logout/route.js
app/api/auth/me/route.js
lib/session.js
lib/auth.js
```

### Registration

When the user signs up:

1. Server validates name, email, and password.
2. Server checks whether the email already exists.
3. `bcryptjs` hashes the password.
4. Only the password hash is saved in the `User` table.
5. A JWT session is signed using `AUTH_SECRET`.
6. The session token is placed in an **HttpOnly** cookie.

The password itself is never stored.

### Login

1. Server loads the account by email.
2. `bcrypt.compare()` checks the submitted password against the stored hash.
3. A valid login receives a new signed session cookie.

### Authorization

The server reads the session and then reloads the user from the database.

Admin APIs additionally require:

```text
user.role === "ADMIN"
```

This means hiding an Admin button in React is not the security mechanism. The server API checks the role too.

---

## 10. Database schema

Main file:

```text
prisma/schema.prisma
```

### User

```text
id
name
email
passwordHash
role
createdAt
updatedAt
```

### Car

```text
id
name
brand
type
image
pricePerDay
rating
reviews
seats
transmission
fuel
active
```

### CarLocation

A car can support multiple cities.

```text
carId -> Car
city
```

### Booking

```text
userId -> User
carId -> Car
pickupLocation
dropoffLocation
pickupDate
returnDate
totalDays
totalPrice
status
```

Relationships:

```text
User 1 -------- many Booking many -------- 1 Car
                                           |
                                           |
                                           many
                                           |
                                           v
                                      CarLocation
```

---

## 11. Cars API and real search

Main endpoint:

```text
GET /api/cars
```

The React form sends filters to this endpoint.

Example:

```text
/api/cars?pickup=Mumbai&dropoff=Pune&pickupDate=2026-09-15&returnDate=2026-09-18&transmission=Automatic
```

The database query can filter by:

```text
car name / brand / type
pickup city
drop city
car type
transmission
fuel
minimum seats
minimum price
maximum price
date availability
```

### Availability logic

A requested booking conflicts when an existing active booking overlaps the requested interval.

Conceptually:

```text
existing pickup <= requested return
AND
existing return >= requested pickup
```

Only `PENDING` and `CONFIRMED` reservations block the car. A cancelled reservation no longer blocks it.

---

## 12. Real booking system

Endpoint:

```text
POST /api/bookings
```

Before saving a reservation, the server verifies:

```text
user is logged in
car exists
car is active
pickup location is supported
drop location is supported
pickup is not in the past
return >= pickup
no overlapping active booking exists
```

Then the server calculates:

```text
total price = rental days × car price per day
```

The booking is saved to SQLite.

When another user searches the same car for overlapping dates, that car is excluded.

That is the difference between the old demo form and this database-backed booking flow.

---

## 13. Customer dashboard

Open:

```text
http://localhost:3000/dashboard
```

A user must be logged in.

The dashboard shows:

```text
account information
total bookings
active bookings
booked value
car
route
dates
total price
booking status
```

A customer can cancel a `PENDING` or `CONFIRMED` booking.

The cancellation updates the database to:

```text
CANCELLED
```

The car then becomes available for that date range again.

---

## 14. Admin dashboard

Log in with the seeded administrator account and open:

```text
http://localhost:3000/admin
```

The admin page contains:

### Statistics

```text
customers
cars
active cars
total bookings
active bookings
booked revenue
```

### Inventory management

The administrator can:

```text
create a car
edit a car
set price
set seats
set fuel
set transmission
set image
set supported cities
activate/archive a car
```

Archiving is a soft delete. The old booking history stays intact.

### Booking management

The admin can change a booking to:

```text
PENDING
CONFIRMED
CANCELLED
COMPLETED
```

---

## 15. Project structure

```text
car-rental-fullstack/
|
|-- app/
|   |-- page.js                    # Home page
|   |-- dashboard/page.js          # Customer dashboard
|   |-- admin/page.js              # Admin dashboard
|   |-- globals.css
|   |-- layout.js
|   |
|   `-- api/
|       |-- auth/
|       |   |-- register/route.js
|       |   |-- login/route.js
|       |   |-- logout/route.js
|       |   `-- me/route.js
|       |-- cars/
|       |   |-- route.js
|       |   `-- [id]/route.js
|       |-- bookings/
|       |   |-- route.js
|       |   `-- [id]/route.js
|       `-- admin/stats/route.js
|
|-- components/
|   |-- AuthProvider.js
|   |-- Navbar.js
|   |-- Hero.js
|   |-- SearchPanel.js
|   |-- Inventory.js
|   |-- CarCard.js
|   |-- Modal.js
|   |-- WhyChooseUs.js
|   |-- Achievements.js
|   |-- CTA.js
|   `-- Footer.js
|
|-- lib/
|   |-- prisma.js
|   |-- session.js
|   |-- auth.js
|   |-- cars.js
|   `-- dates.js
|
|-- prisma/
|   |-- schema.prisma
|   `-- seed.ts
|
|-- scripts/test-database.ts
|-- public/                       # Original images
|-- legacy/                       # Original HTML/CSS retained for comparison
|-- .env.example
|-- prisma.config.ts
|-- package.json
|-- README.md
|-- API_REFERENCE.md
`-- IMPLEMENTATION_GUIDE.md
```

`generated/prisma` and `prisma/dev.db` are created locally and ignored by Git.

---

## 16. Adding your own car

### Through Admin Dashboard

This is the easiest method.

1. Log in as admin.
2. Open `/admin`.
3. Click **Add car**.
4. Fill the form.
5. Save.

### Local image

Put a new image inside:

```text
public/
```

Example:

```text
public/creta.png
```

Use this as the image value:

```text
/creta.png
```

The API/database stores the path.

---

## 17. Reset the database

Stop the development server first.

### macOS / Linux

```bash
rm -f prisma/dev.db prisma/dev.db-journal prisma/dev.db-shm prisma/dev.db-wal
npm run db:setup
```

### Windows PowerShell

```powershell
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-journal -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-shm -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-wal -ErrorAction SilentlyContinue
npm run db:setup
```

This recreates and reseeds everything.

---

## 18. Useful development commands

```bash
npm run dev
```

Development server.

```bash
npm run build
```

Generate Prisma Client and build Next.js.

```bash
npm start
```

Run the production build locally.

```bash
npm run db:generate
```

Regenerate Prisma Client after schema changes.

```bash
npm run db:push
```

Synchronize the local development database with `schema.prisma`.

```bash
npm run db:seed
```

Run seed data.

```bash
npm run db:studio
```

Open the Prisma database UI.

```bash
npm run db:test
```

Run the database connection/count test.

---

## 19. What to say in a project presentation

A precise description is:

> RentalGo began as a static HTML/CSS car-rental interface. I migrated it to the Next.js App Router and React component model, then added a Prisma/SQLite persistence layer, bcrypt password hashing, JWT-based HttpOnly sessions, server-side role authorization, database-backed inventory APIs, date-range availability search, persistent bookings, a customer dashboard, and an admin operations dashboard. Booking conflicts are prevented by checking existing active reservations before creating a new booking.

If asked why Next.js:

> React handles the component UI and state, while Next.js lets the same project provide routing, server-side Route Handlers, authentication endpoints, and the backend-for-frontend API layer.

If asked why Prisma:

> Prisma maps the JavaScript/TypeScript application to relational tables and provides structured queries and relationships for users, cars, locations, and bookings.

If asked why SQLite:

> SQLite makes the academic/local project reproducible on one laptop without a separate database server. For a multi-instance production deployment I would move the same relational model to PostgreSQL.

---

## 20. Production limitations and next deployment steps

The requested architecture is implemented, but a public commercial rental system normally needs additional features.

Before a real production launch, add:

```text
PostgreSQL or another production database
payment provider
email verification
password reset
rate limiting / brute-force protection
CSRF strategy for sensitive mutations
transactional email/SMS
proper observability and audit logs
automated unit/integration/end-to-end tests
image/object storage
legal/privacy/terms pages
backup and recovery plan
```

Do not deploy the seeded demo passwords publicly.

Local SQLite is excellent for this project and demonstration, but do not use an ephemeral serverless filesystem as a production database. Move the Prisma datasource/adapter to a persistent production database for deployment.

---

## 21. Troubleshooting

### `AUTH_SECRET must be set...`

Create `.env` from `.env.example` and use a secret with at least 32 characters.

### `Cannot find generated/prisma/client`

Run:

```bash
npm run db:generate
```

### Database tables do not exist

Run:

```bash
npm run db:setup
```

### Port 3000 is already in use

Use:

```bash
npm run dev -- -p 3001
```

Then open `http://localhost:3001`.

### Remote car images do not appear

Three seed entries use Unsplash URLs, so those images require internet access. Your original BMW, Lamborghini, Verna, and logo assets are local in `public/` and do not require internet.

### Native SQLite adapter install problem

Make sure you are using a supported current Node version (Node 20.19+; Node 22 is recommended for this setup), then delete `node_modules` and retry `npm install`.
