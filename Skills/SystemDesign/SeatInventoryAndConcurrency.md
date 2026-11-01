# Zaria–Kaduna Ride-Sharing Platform - Seat Inventory & Concurrency Engine Skill

Used for governing real-time seat inventory state transitions, concurrency locking in SQLite, and race condition prevention for the **Zaria–Kaduna Ride-Sharing & Seat Booking Platform**.

---

## 1. Seat Inventory State Machine

Each seat within a vehicle trip transitions through a strict finite state machine:

```
                  ┌───────────────────────────────┐
                  │          AVAILABLE            │
                  │   (Seat free for booking)     │
                  └───────────────┬───────────────┘
                                  │
                   Passenger Initiates Checkout
                   (Hold 10-Minute Timer)
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │            HELD               │
                  │ (Temporarily reserved in DB)  │
                  └───────┬───────────────┬───────┘
                          │               │
             Payment SUCCESS              Payment FAILED /
             within 10 mins               Timer EXPIRED
                          │               │
                          ▼               ▼
        ┌─────────────────────────┐   ┌──────────────────────────┐
        │         BOOKED          │   │         RELEASED         │
        │ (Confirmed & Non-Refund)│   │(Returned to AVAILABLE pool)
        └─────────────────────────┘   └──────────────────────────┘
```

---

## 2. Invariant Math & Atomic Booking Protocol

To mathematically guarantee that a 4-passenger saloon car (e.g., Toyota Corolla) can **never** accept 5 passengers:

### The SQLite Transaction Protocol (`BEGIN IMMEDIATE`)
```typescript
import Database from 'better-sqlite3';
const db = new Database('./data/ride.sqlite');

export function reserveSeats(tripId: string, passengerId: string, seatsRequested: number) {
  // Use a transaction that acquires write lock immediately
  const transaction = db.transaction(() => {
    // 1. Read current trip with strict write lock
    const trip = db.prepare(`
      SELECT id, total_seats, available_seats, status 
      FROM trips 
      WHERE id = ?
    `).get(tripId);

    if (!trip) {
      throw new Error('TRIP_NOT_FOUND');
    }

    if (trip.status !== 'published') {
      throw new Error('TRIP_NOT_ACCEPTING_BOOKINGS');
    }

    if (trip.available_seats < seatsRequested) {
      throw new Error('INSUFFICIENT_SEATS');
    }

    // 2. Decrement available seats atomically
    const newAvailable = trip.available_seats - seatsRequested;
    const newStatus = newAvailable === 0 ? 'full' : 'published';

    db.prepare(`
      UPDATE trips 
      SET available_seats = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newAvailable, newStatus, tripId);

    // 3. Create reservation record with 10-minute expiry
    const reservationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO seat_reservations (id, trip_id, passenger_id, seats_reserved, expires_at, status)
      VALUES (?, ?, ?, ?, ?, 'held')
    `).run(reservationId, tripId, passengerId, seatsRequested, expiresAt);

    return { reservationId, seatsReserved: seatsRequested, expiresAt };
  });

  // Execute atomically
  return transaction.immediate();
}
```

---

## 3. Automated Seat Expiration & Garbage Collection

Any passenger who abandons checkout or experiences a declined card must not tie up seat inventory:

```typescript
export function sweepExpiredReservations() {
  const transaction = db.transaction(() => {
    // Find all expired holds
    const expired = db.prepare(`
      SELECT id, trip_id, seats_reserved 
      FROM seat_reservations 
      WHERE status = 'held' AND datetime(expires_at) <= datetime('now')
    `).all();

    for (const hold of expired) {
      // 1. Mark reservation as expired
      db.prepare(`
        UPDATE seat_reservations 
        SET status = 'expired' 
        WHERE id = ?
      `).run(hold.id);

      // 2. Restore available seats to trip
      db.prepare(`
        UPDATE trips 
        SET available_seats = available_seats + ?,
            status = CASE WHEN status = 'full' THEN 'published' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(hold.seats_reserved, hold.trip_id);
    }

    return expired.length;
  });

  return transaction.immediate();
}

// Background scheduler running every 30 seconds
setInterval(sweepExpiredReservations, 30_000);
```
