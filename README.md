# BookMe — Fullstack Appointment Booking Platform

**Role:** Fullstack Developer
**Stack:** TypeScript · NestJS · React · PostgreSQL · Redis
**Type:** Fullstack Web Application

---

## Problem Statement

**Who has the problem?**
Small business owners — hair salons, tutors, clinics, coaches, freelancers — who manage appointment scheduling through WhatsApp messages, phone calls, and paper notebooks. Their clients face the same friction: no way to see availability or book outside of business hours.

**Why it matters?**
Manual scheduling leads to double bookings, missed appointments, and hours of back-and-forth communication every week. For service providers with no technical background, off-the-shelf tools like Calendly are expensive or over-engineered.

**Why this solution exists?**
BookMe provides an affordable, self-contained scheduling platform where service providers can set their availability, and clients can book, receive confirmation, and get reminders — without a single message being sent manually.

---

## Project Goals

- Allow service providers to register, set up their profile, and define available time slots
- Allow clients to browse providers, select services, and book appointments
- Send real-time notifications to both parties on booking, cancellation, and reminder events
- Secure all operations with JWT-based authentication and role-based access control
- Real-time communication: Instant messaging between client and provider for each appointment.
- Build a clean, responsive frontend for both mobile and desktop users

---

## Tech Stack

| Layer          | Technology                      |
|----------------|---------------------------------|
| Language       | TypeScript                      |
| Backend        | NestJS (Node.js)                |
| Frontend       | React · Redux · React Router    |
| Database       | PostgreSQL                      |
| ORM            | Prisma                          |
| Caching        | Redis                           |
| Notifications  | WebSockets / Email (Nodemailer) |
| Deployment     | Vercel (frontend) · Heroku (API)|

---

## Technical Architecture

**Frontend (React)**
Frontend (React + Zustand) The client is a single-page application using React. I implemented Zustand for state management, providing a lightweight and high-performance alternative to Redux. It handles authenticated user data, real-time message states, and booking updates with minimal boilerplate. Protected routes are handled by a custom PrivateRoute component that checks token validity before rendering sensitive pages.

**Backend (NestJS)**
The API follows a modular NestJS architecture. Each domain (auth, users, bookings, notifications) is encapsulated in its own module with its own controller, service, and DTOs. Guards enforce role-based access at the route level (client vs provider roles).

**Database (PostgreSQL + Prisma)**
The relational schema connects Users, Providers, Services, TimeSlots, and Appointments. Foreign key constraints and cascading rules maintain data integrity. Prisma handles all migrations and type-safe queries.

**API Communication**
REST endpoints handle CRUD operations. Redis is used to cache provider availability queries to avoid repeated heavy database reads during peak booking windows.

---

## Features

- **Authentication:** JWT-based login and registration with bcrypt password hashing. Access tokens expire after 15 minutes; refresh tokens stored securely in HTTP-only cookies.
- **Role-Based Access Control:** Two roles — `client` and `provider`. NestJS Guards enforce which routes each role can access. Providers cannot book their own slots; clients cannot edit provider profiles.
- Instant Messaging: A dedicated chat interface for every appointment. Clients and providers can discuss details in real-time once a booking is confirmed.
- **Availability Management:** Providers define weekly availability windows. The system generates time slots dynamically and marks them as booked when reserved.
- **Appointment Booking:** Clients select a provider, choose a service and available slot, and confirm. Concurrent booking conflicts are handled with database-level locking.
- **Real-Time Notifications:** Booking confirmations, cancellations, and 24-hour reminders are delivered via email. WebSocket events notify the provider dashboard instantly on new bookings.
- **Input Validation:** All DTOs are validated using `class-validator` decorators in NestJS. Invalid payloads return structured 400 responses before reaching business logic.
- **Error Handling:** Global exception filters catch unhandled errors and return consistent JSON error shapes. Prisma-specific errors (unique violations, foreign key failures) are mapped to user-friendly messages.
- **Responsive Design:** The frontend adapts from mobile (320px) to desktop (1440px) using CSS Flexbox and Grid without any CSS framework dependency.

---

## Screenshots

<img width="1848" height="922" alt="Screenshot from 2026-03-02 16-12-04" src="https://github.com/user-attachments/assets/06889480-ad31-4150-a72c-c1c337d0a319" />
<img width="1848" height="922" alt="Screenshot from 2026-03-02 16-12-18" src="https://github.com/user-attachments/assets/d858db7b-0151-41d1-8518-a52760cdb196" />


---

## Live Demo

> API: _coming soon_
[bookMe](https://bookme-front-end-9a8n.vercel.app)
[API](https://bookmeapp-api.onrender.com)

---

## Installation & Setup

### Prerequisites

- Node.js v18+
- PostgreSQL
- Redis
- npm

### Backend Setup

```bash
# 1. Clone the API repository
git clone https://github.com/Diderot-sielinou/bookMeApp-api.git
cd bookMeApp-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the server
npm run start:dev
```

### Frontend Setup

```bash
# 1. Clone the frontend repository
git clone https://github.com/Diderot-sielinou/bookmeFrontEnd.git
cd bookmeFrontEnd

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the dev server
npm run dev
```

### Environment Variables (API)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bookme
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
MAIL_HOST=smtp.example.com
MAIL_USER=your@email.com
MAIL_PASS=yourpassword
PORT=3001
```

---

## Challenges Faced

**Frontend Challenge — Managing Protected Routes**
React Router alone does not block unauthenticated access to protected pages. After the initial page load, a user could manually navigate to `/dashboard` without a valid token. I solved this by building a `PrivateRoute` wrapper component that reads the token from Redux state, verifies it exists and is not expired on every render, and redirects to `/login` if the check fails. This also required handling the case where the Redux store is empty on first load before the persisted state is rehydrated.

**Backend Challenge — Preventing Double Bookings**
With concurrent requests, two clients could read the same time slot as available and both successfully book it. A standard read-then-update sequence has a race condition window. I resolved this by wrapping the slot lookup and booking creation in a Prisma transaction with a `SELECT FOR UPDATE` equivalent, ensuring only one request can hold the lock and complete the booking, while the second receives a 409 Conflict response.

**Debugging Experience — Redis Cache Invalidation**
After implementing Redis caching for provider availability, I noticed that bookings did not reflect immediately — clients could still see a slot as available seconds after it was booked. The bug was that the cache TTL was set to 10 minutes and was not being explicitly cleared on booking creation. I added a cache invalidation call at the end of the booking service method, targeting the provider's specific cache key, which resolved the stale data issue.

---

## What I Learned

**Technical lesson:** Database transactions are not just for preventing data loss — they are a primary tool for concurrency control. Understanding when to use transactions versus application-level locks was a key architectural insight.

**Workflow lesson:** Designing the API schema and DTO contracts before writing handlers meant the frontend and backend could be developed in parallel without blocking each other. This discipline would be essential in a team setting.

**Code organization lesson:** NestJS's module system enforced a separation of concerns I had not practiced before. Keeping the booking logic in a `BookingService` and only exposing what each role needed through `BookingController` made the codebase significantly easier to reason about and extend.

---

## Future Improvements

- Add Stripe integration for paid bookings and provider payouts
- Build a provider analytics dashboard (bookings per week, revenue, cancellation rate)
- Implement recurring appointment scheduling
- Add a public booking link that providers can share on social media without clients needing an account
- SMS notifications via Twilio as an alternative to email
- Admin panel for platform moderation
