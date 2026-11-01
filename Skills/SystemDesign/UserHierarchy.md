# Zaria–Kaduna Ride-Sharing Platform - User Hierarchy & Dashboard Governance Skill

Used for defining the architectural specifications, access control matrix, dashboard views, and role boundaries for **Passengers**, **Drivers**, and **Platform Administrators**.

---

## 1. 3-Tier User Hierarchy Specification

```
                          ┌────────────────────────┐
                          │   Platform Admin       │
                          │   (Global Governance)  │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌────────────────────────┐                             ┌────────────────────────┐
│      Driver Tier       │                             │     Passenger Tier     │
│  (Vehicle Registration │                             │  (Trip Search, Booking │
│   & Trip Publishing)   │                             │   & Seat Payment)      │
└────────────────────────┘                             └────────────────────────┘
```

---

## 2. Dashboard Interface Contracts

### A. Driver Dashboard
Designed for drivers (car owners, dealers, mechanics) managing intercity trips:
1. **Summary Metrics Cards**:
   * **Total Trips**: Lifetime trips published and completed.
   * **Upcoming Trips**: Trips scheduled for departure in the next 24–48 hours.
   * **Real-Time Seat Availability**: Live indicator showing available vs. booked seats per trip.
   * **Total Net Earnings (₦)**: Accrued payouts awaiting or completed to bank account.
2. **Passenger Manifest & Pickup Coordination**:
   * List of booked passengers per trip with seat count and revealed phone numbers for day-of-travel coordination.
3. **Trip Action Center**:
   * *Create New Trip*: Form with departure time, vehicle picker, price per seat, and exact meeting point.
   * *Mark as Full*: Instant toggle to close bookings manually if needed.
   * *Cancel Trip*: Safely cancel trip with automatic passenger refund triggers and notification broadcasts.

### B. Passenger Dashboard
Streamlined for everyday travelers, students, and lecturers:
1. **Active & Upcoming Bookings**:
   * Booking Reference Card (e.g., `ZK-202610-8472`).
   * Vehicle summary (Make, Model, Color, Plate Number).
   * Departure date & scheduled time.
   * **Unlocked Meeting Point**: Exact pickup instructions and one-tap "Call Driver" button (visible only post-payment).
2. **Trip Discovery & Search Engine**:
   * Date and time pickers.
   * Filter chips: "With A/C", "Under ₦2,000", "Saloon Car vs. SUV".
3. **Booking & Payment History**:
   * Full transaction logs with Paystack/Flutterwave reference IDs, seats booked, and digital receipts.

### C. Super Administrator Dashboard
Comprehensive platform-wide management console:
1. **Platform KPI Overview**:
   * Total Registered Users (Breakdown: Passengers vs. Drivers).
   * Verified vs. Pending Drivers.
   * Active Vehicles in Registry.
   * Total Trips (Active, In-Transit, Completed, Cancelled).
   * Gross Booking Volume (GBV) & Platform Revenue (10% commission).
2. **Driver Vetting Console**:
   * Queue of pending driver applications with NIN, driver's license, and vehicle photos.
   * One-click "Approve Driver" or "Reject with Feedback" actions.
3. **Trip & Booking Monitor**:
   * Real-time ledger of all active bookings, seat reservation holds, and payment transaction statuses.
   * Ability to issue refunds or intervene in disputes.
