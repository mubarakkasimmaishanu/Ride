# Zaria–Kaduna Ride-Sharing Platform - Debug Skill & Diagnostic Blueprint

Used for diagnosing errors, triaging unexpected behavior, inspecting logs, tracing failed requests, and maintaining system health across the **React Native / Expo Client** and the **Lightweight SQLite Backend**.

---

## 1. Defensive Diagnostic Philosophy

To ensure regressions and race conditions are caught instantly without cascading across the platform:
1. **Isolated Action Services**: Controllers must remain under 25 lines. Business actions (e.g., `ReserveSeatsService`, `ConfirmPaymentService`, `PublishTripService`) exist as self-contained functions with explicit input schemas.
2. **Deterministic Error Responses**: Every API error must return a standard JSON structure:
   ```json
   {
     "success": false,
     "error": {
       "code": "SEAT_UNAVAILABLE",
       "message": "Only 1 seat remains on this trip. You requested 2.",
       "details": { "tripId": "zk-841", "available": 1, "requested": 2 }
     }
   }
   ```

---

## 2. Common Failure Modes & Fast-Fix Blueprints

### A. SQLite Concurrency & Lock Contention (`SQLITE_BUSY`)
* **Symptom**: Under sudden spikes of simultaneous seat reservations, the server logs `Error: SQLITE_BUSY: database is locked`.
* **Root Cause**: SQLite defaults to rollback journal mode where writers block concurrent readers and writers.
* **Resolution**:
  1. Ensure **WAL mode (Write-Ahead Logging)** is permanently enabled on database initialization:
     ```typescript
     db.pragma('journal_mode = WAL');
     db.pragma('synchronous = NORMAL');
     db.pragma('busy_timeout = 5000'); // 5-second wait buffer
     ```
  2. Use `BEGIN IMMEDIATE` transactions for seat reservations to acquire write locks early and prevent deadlocks.

### B. Payment Webhook Dropouts / Network Failures
* **Symptom**: Passenger completes payment in Paystack modal, but screen stays on "Waiting for Confirmation" because the webhook failed to hit the local server or was delayed by network issues.
* **Resolution**:
  * Implement **Dual-Path Settlement**:
    1. Primary Path: Paystack Webhook listener.
    2. Fallback Path: When the client receives the `onSuccess` callback from the Paystack Expo SDK, it triggers `POST /api/v1/payments/verify { reference: "..." }`. The backend directly queries `https://api.paystack.co/transaction/verify/:reference` to verify the payment immediately if the webhook has not arrived yet.

### C. Ghost Seat Reservations (Seats Not Releasing)
* **Symptom**: Trip shows `available_seats = 0`, but passengers only paid for 2 out of 4 seats because 2 abandoned checkouts remained held.
* **Resolution**:
  * Verify the cleanup scheduler (cron or `setInterval` running every 60 seconds) is executing:
    ```sql
    -- Release expired reservations
    UPDATE trips
    SET available_seats = available_seats + (
        SELECT COALESCE(SUM(seats_reserved), 0)
        FROM seat_reservations
        WHERE trip_id = trips.id AND status = 'held' AND expires_at < CURRENT_TIMESTAMP
    )
    WHERE id IN (
        SELECT DISTINCT trip_id FROM seat_reservations
        WHERE status = 'held' AND expires_at < CURRENT_TIMESTAMP
    );

    UPDATE seat_reservations
    SET status = 'expired'
    WHERE status = 'held' AND expires_at < CURRENT_TIMESTAMP;
    ```

---

## 3. Expo & React Native Debugging Playbook

1. **Network Request Failures in Android Emulator / Physical Device**:
   * Calling `localhost:3000` or `127.0.0.1:3000` from Android fails because `localhost` refers to the device itself.
   * On Android Emulator, use `http://10.0.2.2:3000`.
   * On a physical device running Expo Go over Wi-Fi, use your local machine LAN IP (e.g., `http://192.168.1.X:3000`).
2. **Clear Metro Cache**:
   * When styles or assets don't update as expected:
     ```bash
     npx expo start --clear
     ```
