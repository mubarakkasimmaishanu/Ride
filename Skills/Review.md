# Zaria–Kaduna Ride-Sharing Platform - Review Skill

Used for reviewing source code for correctness, patterns, styling, readability, security, and performance prior to committing or deploying changes to the **Zaria–Kaduna Ride-Sharing & Seat Booking Platform**.

---

## 1. Architectural Alignment & Gatekeeper Checklist

Every pull request or commit must pass this 6-point verification gate:

### 1. Meeting Point Privacy Gate (Critical Security)
- [ ] Does `exact_meeting_point` exist in the SQL query for public search? **If YES $\to$ REJECT.**
- [ ] Does `driver.phone_number` appear in any public trip list endpoint? **If YES $\to$ REJECT.**
- [ ] Is exact meeting point disclosure guarded by a verified `payment_status === 'paid'` check on the backend?

### 2. Concurrency & Seat Booking Math
- [ ] Are seat holds and bookings wrapped in an explicit SQLite transaction (`BEGIN IMMEDIATE`)?
- [ ] Is `available_seats` checked in the same atomic transaction as the reservation creation?
- [ ] Is overbooking physically impossible at the database schema level (`CHECK(available_seats >= 0)`)?

### 3. Payment Verification Integrity
- [ ] Are payments verified server-side via official webhook or server-to-server REST calls to Paystack/Flutterwave?
- [ ] Is `PAYSTACK_SECRET_KEY` excluded from any frontend bundle or `EXPO_PUBLIC_` configuration?

### 4. Database Safety
- [ ] Are all SQLite queries parameterized using query binders (`?` or named parameters)?
- [ ] Are indexes present for high-frequency queries (`trips(route_id, departure_time)`, `bookings(passenger_id)`)?

### 5. Mobile UX & Responsiveness (React Native / Expo)
- [ ] Does the trip listing use performant lists (`FlatList` or `@shopify/flash-list`) with memoized items?
- [ ] Are vehicle and driver images loaded with thumbnail fallbacks and loading skeletons?
- [ ] Are error banners human-friendly (e.g., *"Network connection issue. Please check your internet and tap Retry"*)?

### 6. Clean Code & Separation of Concerns
- [ ] Are controllers lightweight ($\le 25$ lines)?
- [ ] Is business logic strictly housed in domain service classes / single-action functions?
