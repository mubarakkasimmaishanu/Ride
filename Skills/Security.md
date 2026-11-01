# Zaria–Kaduna Ride-Sharing Platform - Security Skill

Used for enforcing strict cybersecurity standards, regulatory compliance (Nigeria Data Protection Act 2023), role-based data isolation, payment integrity, and the **Meeting Point Privacy Vault Protocol**.

---

## 1. The Meeting Point Privacy Vault Protocol

A fundamental security principle of the Zaria–Kaduna platform is physical and operational security for drivers and passengers:

### The Problem
If exact pickup spots (e.g., *"Wait for me by the black gate behind Total Filling station Kwangila"*) and driver phone numbers are public, rogue actors or competitors can hijack passengers, harass drivers, or conduct off-platform bypass transactions without paying platform fees.

### The Security Directive
1. **Zero-Knowledge Pre-Payment**:
   - The backend serialization layer **MUST NEVER** include `exact_meeting_point` or `driver.phone_number` in any public or search response.
   - Only `general_pickup_area` (e.g., *"Kwangila Flyover Vicinity, Zaria"*) and sanitized vehicle descriptors are returned.
2. **Post-Payment Decryption & Authorization Gate**:
   - A dedicated endpoint (`GET /api/v1/bookings/:id/meeting-details`) validates:
     - The requester's JWT belongs to the booking's `passenger_id`.
     - The booking's `payment_status` is strictly `'paid'`.
   - Only when both conditions are satisfied are the driver's phone number and exact meeting instructions unlocked.
   - Any attempt to access this endpoint with an `'unpaid'` or `'pending'` status triggers an immediate `403 Forbidden` and security audit log.

---

## 2. Role-Based Access Control (RBAC) & Boundary Isolation

The platform enforces three distinct security personas:

| Capability | Passenger | Driver | Super Admin |
| :--- | :---: | :---: | :---: |
| Browse public trips & available seat counts | Yes | Yes | Yes |
| Reserve & pay for seats | Yes | No | No |
| Access exact meeting point (post-payment) | Own booking only | Own trip only | Audit access |
| Publish & manage vehicle trips | No | Verified only | Platform override |
| View booked passenger manifest & phone numbers | No | Own trip only | All trips |
| Approve / suspend driver accounts | No | No | Yes |
| Access platform revenue & transaction logs | No | No | Yes |

### Driver Verification Security Gate
* Drivers cannot publish any trip until `drivers.verification_status == 'approved'`.
* Submitting driver profile sets status to `'pending'`, locking trip publishing routes with an `HTTP 403 (DriverNotApprovedException)`.
* **Mandatory Union Gate**: An admin cannot approve a driver profile without verifying a valid membership card or branch registration slip from an accredited Road Transport Union (NURTW / RTEAN) in **Kaduna, Zaria, or Kano**.

---

## 3. Payment Gateway & Webhook Security

1. **HMAC Signature Verification**:
   - Webhooks from Paystack or Flutterwave must be verified using the platform's secret key:
     ```typescript
     // Paystack HMAC SHA512 check
     const hash = crypto
       .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
       .update(JSON.stringify(req.body))
       .digest('hex');
     if (hash !== req.headers['x-paystack-signature']) {
       return res.status(401).send('Invalid webhook signature');
     }
     ```
2. **Idempotency & Replay Prevention**:
   - Webhook processing must wrap transaction updates in a unique constraint on `payments.transaction_reference`.
   - If a webhook re-delivers an already processed reference, the backend logs the duplicate and immediately returns `HTTP 200` without double-crediting or re-triggering notifications.
3. **Double Verification Rule**:
   - Webhooks are primary, but client-initiated verification (`POST /api/v1/payments/verify`) calls the Paystack/Flutterwave REST API directly server-to-server before confirming booking. Never trust client-submitted status strings.

---

## 4. Mobile Client (React Native / Expo) Hardening

1. **No Backend Secrets in Client**:
   - Never embed `PAYSTACK_SECRET_KEY`, database credentials, or admin API tokens inside the React Native bundle or `EXPO_PUBLIC_` variables.
   - Only `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` is allowed on the client for initial checkout initialization.
2. **Secure Token Storage**:
   - Use `expo-secure-store` for storing JWT access and refresh tokens on iOS (Keychain) and Android (EncryptedSharedPreferences). Never use plain `AsyncStorage` for sensitive auth tokens.
3. **Input Sanitization & Parameterized Queries**:
   - All SQLite queries in the lightweight backend must use strictly parameterized bindings (`?` or named parameters). String concatenation in SQL statements is strictly prohibited.
