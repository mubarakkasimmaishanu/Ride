# Zaria–Kaduna Ride-Sharing Platform - Testing & Quality Assurance Skill

Used for planning, writing, and executing automated test suites, race condition validations, and manual verification checklists for the **Zaria–Kaduna Ride-Sharing & Seat Booking Platform**.

---

## 1. Concurrency & Race Condition Test Matrix (Zero Double-Booking)

The most critical test protocol is ensuring that simultaneous booking requests for the last remaining seat can never result in an overbooked vehicle.

### The 1-Seat Collision Test Specification
* **Pre-condition**: Trip has `total_seats = 4`, `booked_seats = 3`, `available_seats = 1`.
* **Action**: Simulate 2 concurrent HTTP requests sent within $\le 5\text{ms}$ of each other from Passenger A and Passenger B, each attempting to reserve 1 seat.
* **Assertions**:
  1. Exactly **one** request succeeds with `HTTP 201 Created` and receives a valid reservation token.
  2. The competing request receives `HTTP 409 Conflict` (or `HTTP 422`) with error code `INSUFFICIENT_SEATS_AVAILABLE`.
  3. `trips.available_seats` equals `0`.
  4. Total active held seats + booked seats strictly equals `4`.

---

## 2. Invariant Math & Database Integrity Tests

Every test suite must assert the following fundamental equations:

$$\text{total\_seats} \equiv \text{available\_seats} + \text{booked\_seats} + \text{active\_held\_seats}$$

$$\text{available\_seats} \ge 0$$

$$\text{booked\_seats} \le \text{total\_seats}$$

Any state mutation that violates these bounds must be aborted and rolled back immediately by the database engine.

---

## 3. Meeting Point Security & Privacy Leak Tests

Automated API integration tests must inspect all public and unauthenticated responses:
* **Test Case**: `GET /api/v1/trips/search`
  * Assert `response.body[0].exact_meeting_point` is `undefined`.
  * Assert `response.body[0].driver.phone_number` is `undefined`.
  * Assert `response.body[0].general_pickup_area` is present and matches expected string (e.g., *"Kwangila Flyover"*).
* **Test Case**: `GET /api/v1/bookings/:id/meeting-details` (Pre-Payment)
  * Pre-condition: Booking exists with `payment_status = 'pending'`.
  * Request: Passenger calls endpoint with valid bearer token.
  * Assert: `HTTP 403 Forbidden` with message *"Payment required to view exact meeting point"*.
* **Test Case**: `GET /api/v1/bookings/:id/meeting-details` (Post-Payment)
  * Pre-condition: Booking marked `payment_status = 'paid'`.
  * Assert: `HTTP 200 OK` returning exact address and driver phone number.

---

## 4. Payment Webhook Verification Tests

1. **Tampered Signature**:
   - Send payload with invalid `x-paystack-signature`.
   - Assert `HTTP 401 Unauthorized` and no database state changes.
2. **Duplicate Webhook Delivery (Idempotency)**:
   - Send identical `charge.success` payload twice.
   - Assert both return `HTTP 200 OK`, but only one payment record is created, and seat count is not decremented twice.

---

## 5. Mobile Interface Testing (React Native / Expo)

* **Form Validation**:
  * Passenger cannot select more seats than `available_seats` via the seat stepper component.
  * Price automatically calculates: $\text{Seats} \times \text{Price Per Seat}$.
* **Network Interruption**:
  * Test app behavior under weak 2G/3G network conditions (typical on highway stretches between Zaria and Kaduna).
  * Ensure loading spinners, retry buttons, and cached trip lists work smoothly without crashing the React Native thread.
