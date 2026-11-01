# Zaria–Kaduna–Kano Ride-Sharing Platform - Finance & Revenue Operations Skill

Used for governing tri-city corridor pricing, payment gateway integrations, in-app passenger wallets, instant cancellation refunds, and commission structures for the **Zaria–Kaduna–Kano Ride-Sharing & Seat Booking Platform**.

---

## 1. Tri-City Corridor Pricing Benchmarks

The platform covers three primary inter-city express corridors across Northern Nigeria:

| Corridor | Distance | Standard Saloon (Non-AC) | Executive / Full AC Saloon / SUV | Commercial Park Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Zaria $\longleftrightarrow$ Kaduna** | ~78 km | **₦1,500 – ₦2,000** | **₦2,500 – ₦3,500** | ₦1,200 – ₦1,500 (Overloaded) |
| **Zaria $\longleftrightarrow$ Kano** | ~140 km | **₦2,500 – ₦3,500** | **₦4,000 – ₦5,000** | ₦2,000 – ₦2,500 (Overloaded) |
| **Kaduna $\longleftrightarrow$ Kano** | ~210 km | **₦3,500 – ₦4,500** | **₦5,000 – ₦6,500** | ₦3,000 – ₦3,500 (Overloaded) |

* **Embedded Micro-Insurance Fee**: **₦150 per seat** is bundled into all ticket fares, guaranteeing emergency medical and personal accident insurance.

---

## 2. In-App Passenger Wallet & Instant Refund Engine

To eliminate the 24–72 hour Paystack bank refund delay:

### A. The In-App Wallet ("Ride Credits")
* Every passenger account includes an in-app wallet balance (`wallets` table).
* When a booking is cancelled by a driver or the driver fails to show:
  1. The booking status is marked `'cancelled'`.
  2. 100% of the fare is credited **instantly to the passenger's in-app wallet within 1 second**.
  3. Passenger can immediately tap "Rebook Next Driver" without waiting for bank clearance.
  4. Passenger can also withdraw wallet funds back to their Nigerian bank account at any time.

### B. Driver No-Show Penalty & Compensation Credit
* If an approved driver cancels less than 30 minutes before departure or fails to show up:
  * A **₦1,000 penalty** is debited from the driver's ledger balance.
  * **₦500** is credited to the stranded passenger's wallet as an apology compensation credit.

---

## 3. Platform Commission & Driver Loyalty Tiers

| Tier | Monthly Completed Trips | Driver Rating | Platform Commission |
| :--- | :---: | :---: | :---: |
| **Standard Driver** | 1 – 9 trips | $\ge 4.5$ | **10%** |
| **Gold Frequent Driver** | 10 – 24 trips | $\ge 4.7$ | **7%** |
| **Champion Courier** | 25+ trips | $\ge 4.8$ | **5%** (Plus fuel voucher incentives) |

* Rewarding union-accredited drivers with a low 5% commission tier keeps frequent commuters and mechanics active on-platform and eliminates off-app disintermediation.
