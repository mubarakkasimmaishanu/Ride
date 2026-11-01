# Zaria–Kaduna Ride-Sharing Platform - Payment Workflow & Reconciliation Skill

Used for governing payment processing via Paystack and Flutterwave, mobile checkout orchestration, webhook security, and driver payout reconciliation for the **Zaria–Kaduna Ride-Sharing & Seat Booking Platform**.

---

## 1. End-to-End Payment Lifecycle

```
[Passenger Confirms Seat Selection]
               │
               ▼
   [Reserve Seats (10-min Hold)]
               │
               ▼
[Initialize Paystack / Flutterwave Checkout]
  - Amount: Seats * Price Per Seat (NGN)
  - Reference: Unique Reference (e.g. ZK-PAY-82194)
  - Customer Email & Phone
               │
               ▼
[React Native Client Displays Paystack Modal]
  - Card, Bank Transfer, USSD (*737#, *966#, etc.)
               │
               ▼
       Payment Completed
               │
       ┌───────┴───────────────────────────────┐
       ▼                                       ▼
[Client Callback (onSuccess)]        [Paystack Server Webhook]
       │                                       │
       ▼                                       ▼
[POST /api/v1/payments/verify]       [POST /api/v1/webhooks/paystack]
       │                                       │
       └───────────────────┬───────────────────┘
                           ▼
            [Idempotent Verification Worker]
            1. Validate Signature (HMAC SHA512)
            2. Verify Amount with Gateway
            3. Check if reference already processed
            4. Atomic DB Transaction:
               - Update bookings: payment_status = 'paid'
               - Update seat_reservations: status = 'converted'
               - Insert payments record
               - Increment trip.booked_seats
               - Unlock exact meeting point
```

---

## 2. Server-Side Verification & Idempotency Implementation

```typescript
import crypto from 'crypto';
import axios from 'axios';

export async function processPaystackWebhook(signature: string, payload: any) {
  // 1. Signature Verification
  const expectedHash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedHash) {
    throw new Error('INVALID_WEBHOOK_SIGNATURE');
  }

  const { event, data } = payload;
  if (event !== 'charge.success') {
    return { status: 'ignored', reason: 'non-charge event' };
  }

  const reference = data.reference;
  const paidAmountKobo = data.amount;
  const paidAmountNaira = paidAmountKobo / 100;

  // 2. Atomic Idempotent Settlement
  const settlement = db.transaction(() => {
    // Check if already processed
    const existingPayment = db.prepare(`
      SELECT id FROM payments WHERE transaction_reference = ?
    `).get(reference);

    if (existingPayment) {
      return { status: 'already_processed' };
    }

    // Locate booking by reference or metadata
    const booking = db.prepare(`
      SELECT b.id, b.trip_id, b.seats_booked, b.total_amount, b.payment_status,
             t.driver_id, t.price_per_seat
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.booking_reference = ? OR b.id = ?
    `).get(data.metadata?.booking_reference || reference, data.metadata?.booking_id);

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND_FOR_TRANSACTION');
    }

    if (paidAmountNaira < booking.total_amount) {
      throw new Error('UNDERPAYMENT_DETECTED');
    }

    // Record payment
    db.prepare(`
      INSERT INTO payments (id, booking_id, payment_provider, transaction_reference, amount, currency, payment_status, gateway_response, paid_at)
      VALUES (?, ?, 'paystack', ?, ?, 'NGN', 'success', ?, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), booking.id, reference, paidAmountNaira, JSON.stringify(data));

    // Confirm booking
    db.prepare(`
      UPDATE bookings 
      SET payment_status = 'paid', booking_status = 'confirmed', 
          meeting_point_revealed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(booking.id);

    // Convert seat reservation
    db.prepare(`
      UPDATE seat_reservations 
      SET status = 'converted' 
      WHERE trip_id = ? AND passenger_id = (SELECT passenger_id FROM bookings WHERE id = ?) AND status = 'held'
    `).run(booking.trip_id, booking.id);

    // Update trip counts
    db.prepare(`
      UPDATE trips 
      SET booked_seats = booked_seats + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(booking.seats_booked, booking.trip_id);

    return { status: 'settled', bookingId: booking.id };
  });

  return settlement.immediate();
}
```

---

## 3. Financial Reconciliation & Ledger Auditing

1. **Daily Settlement Ledger**:
   - The platform calculates gross booking volume (GBV) daily.
   - Driver earnings are tracked separately from platform commissions.
2. **Dispute & Refund Workflow**:
   - In the event of a driver trip cancellation, Paystack API `POST /refund` is invoked automatically, releasing platform hold and refunding the passenger within 24 hours.
