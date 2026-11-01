# Zaria–Kaduna–Kano Ride-Sharing Platform - Remember Skill (Persistent Memory & State)

## 1. Primary Objective & Mandate

> **ZARIA–KADUNA–KANO INTER-CITY RIDE-SHARING & SEAT BOOKING PLATFORM**
>
> **Project Overview**:
> Develop a modern, responsive, mobile-first ride-sharing application connecting passengers travelling across the **Zaria – Kaduna – Kano Northern Transport Corridor** with verified car owners, automobile dealers, and mechanics who regularly travel these routes.
>
> **Supported Inter-City Corridors**:
> 1. **Zaria $\longleftrightarrow$ Kaduna** (~78 km)
> 2. **Zaria $\longleftrightarrow$ Kano** (~140 km)
> 3. **Kaduna $\longleftrightarrow$ Kano** (~210 km)
>
> **Core Value Proposition**:
> 1. Drivers monetize empty seats on trips they already take across the tri-city corridor.
> 2. Passengers enjoy clean, fast, air-conditioned private travel with verified union-registered drivers.
> 3. Zero-risk meeting point security: Driver micro-location and phone numbers are locked until payment, while verified landmark hubs provide complete geographic predictability.

---

## 2. Key Personas & Target Users

1. **Drivers (Union-Accredited Private Owners, Dealers, Mechanics)**:
   - Private car owners commuting for business, university lectures, or civil service across Zaria, Kaduna, and Kano.
   - Mechanics and auto dealers transporting vehicles between Kano automobile markets, Zaria workshops, and Kaduna specialized services.
   - **Mandatory Union Registration**: Every driver must be officially registered with a Road Transport Union office in **Kaduna, Zaria, or Kano**.
2. **Passengers**:
   - Students and faculty (ABU Zaria, BUK Kano, Kaduna State University, Nuhu Bamalli, FCE Kano).
   - Traders and merchants commuting between Kano commercial markets (Kantin Kwari, Dawanau) and Zaria/Kaduna.
   - Civil servants and corporate travelers seeking direct, safe, scheduled departures.
3. **Super Administrators**:
   - Platform managers vetting driver credentials, validating union registration slips, managing tri-city safe hubs, and supervising financial operations.

---

## 3. The 8 Non-Negotiable Operational & Engineering Invariants

1. **Mandatory Road Transport Union Registration**:
   - A driver **cannot** be approved or publish any trip without submitting proof of registration with an accredited Road Transport Union office (e.g., **NURTW**, **RTEAN**, or State Transport Union) in **Kaduna, Zaria, or Kano**.
   - This legal and operational alignment turns transport unions into recognized partners, eliminating roadside hostility.
2. **Tri-City Designated Safe Hubs (100m Off-Park Buffer)**:
   - Pickups and drop-offs are restricted to pre-approved institutional, educational, and commercial safe hubs in Zaria, Kaduna, and Kano. Loading inside or within 100m of commercial motor park gates is strictly prohibited.
3. **Hierarchical Landmark Privacy**:
   - Pre-payment: Displays the verified landmark hub with a 250m shaded radius on the map.
   - Post-payment: Unlocks exact micro-spot instructions, vehicle plate number, driver call button, and offline boarding PIN.
4. **Instant In-App Wallet Refunds**:
   - Driver cancellations or no-shows refund 100% of passenger funds directly to their in-app wallet within **1 second**, allowing immediate rebooking without 72-hour bank delays.
5. **Driver Stake & No-Show Accountability**:
   - Cancellations $< 30$ minutes before departure incur a ₦1,000 driver debit; ₦500 is credited to the passenger as compensation.
6. **Atomic Seat Booking & Concurrency**:
   - Strict equation enforced: `Total Capacity == Booked Seats + Available Seats + Active Held Seats`.
   - Atomic database locking prevents overbooking; unpaid reservations expire after 10 minutes.
7. **Offline-First Boarding Protocol (Highway Dead Zone Safe)**:
   - A 4-digit cryptographically generated PIN and QR pass stored in `expo-secure-store` enables offline verification between driver and passenger apps during highway network blackouts (e.g., between Jaji and Maraban Jos, or Kwanar Dangora).
8. **Database Scalability (Dev SQLite $\to$ Prod PostgreSQL)**:
   - Built on a query builder / ORM abstraction (Kysely/Prisma) enabling fast local SQLite development and zero-rewrite PostgreSQL production deployment.
