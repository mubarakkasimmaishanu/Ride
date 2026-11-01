# Zaria–Kaduna–Kano Ride-Sharing Platform - Meeting Point Privacy & Safe Hub Reveal Skill

Used for enforcing the architectural and operational design of the **Hierarchical Two-Tier Geofencing**, **Designated Safe Hubs**, and **Union Verification Badge** across **Zaria, Kaduna, and Kano**.

---

## 1. Designated Safe Hubs (Kaduna, Zaria, Kano)

To eliminate interference from commercial motor park unions, pickups and dropoffs within 100 meters of commercial park gates are strictly prohibited. The system mandates selection from verified safe hubs:

| Hub Location | City | Category | Security Rationale |
| :--- | :---: | :---: | :--- |
| **ABU Samaru Main Gate Hub** | Zaria | Institutional | University security perimeter; zero union harassment. |
| **Total Filling Station Forecourt** | Zaria | Commercial | Kwangila bypass forecourt with safe parking. |
| **Kongo Campus Gate Hub** | Zaria | Institutional | Secure student and administrative staff pickup point. |
| **Nuhu Bamalli Polytechnic Hub** | Zaria | Educational | Southern Zaria departure point. |
| **Dialogue Pharmacy Bypass Hub** | Kaduna | Commercial | Kawo bypass; avoids congested Kawo motor park gates. |
| **Command Junction Commercial Complex** | Kaduna | Commercial | South Kaduna and bypass distribution node. |
| **NNPC Mega Station Hub** | Kaduna | Commercial | Central business district node. |
| **Naibawa Flyover Bypass Hub** | Kano | Commercial | Zaria Road entry point into Kano; safe service lane. |
| **BUK New Campus Main Gate Hub** | Kano | Institutional | Premier university student and faculty zone on Western bypass. |
| **Silver Jubilee State Road Hub** | Kano | Commercial | Central Kano access near commercial and administrative offices. |
| **Dawanau Bypass Hub** | Kano | Commercial | Northern distribution gateway serving cross-city merchants. |

---

## 2. Hierarchical Two-Tier Geofencing Architecture

```
+-------------------------------------------------------------------------+
|                  Stage 1: Public Discovery Projection                   |
|                  (Pre-Payment / Unauthenticated User)                   |
|                                                                         |
|  * Trip ID: "zkk-104"                                                   |
|  * Corridor: "Zaria -> Kano"                                            |
|  * Origin Hub: "ABU Samaru Main Gate Hub, Zaria"                        |
|  * Geofence Zone: 250m radius shaded on mobile map                      |
|  * Destination Hub: "BUK New Campus Main Gate Hub, Kano"                |
|  * Departure: "2026-11-02 08:00 AM"                                     |
|  * Vehicle: "Toyota Camry (Wine Red, AC Available)"                     |
|  * Available Seats: 3                                                   |
|  * Price: "₦3,000 (Includes ₦150 Ride Micro-Insurance)"                 |
|  * Union Accreditation: "Verified NURTW Zaria Branch" (Trust Badge)     |
|                                                                         |
|  * Exact Micro-Spot: [LOCKED - Unlocks upon payment confirmation]       |
|  * Vehicle Plate Number: [LOCKED - Unlocks upon payment confirmation]   |
|  * Driver Phone Number: [LOCKED - Unlocks upon payment confirmation]    |
+-------------------------------------------------------------------------+
                                     │
                        Passenger Completes Payment
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                  Stage 2: Post-Payment Reveal Vault                     |
|                    (Authenticated Paid Passenger)                       |
|                                                                         |
|  * Booking Reference: "ZKK-202611-9218"                                 |
|  * Payment Status: "PAID"                                               |
|  * Exact Micro-Spot: "Parked opposite the bank ATM gallery, Gate 1"     |
|  * Vehicle Plate: "KAN-719-BB" (Wine Red Camry)                         |
|  * Driver Name: "Ibrahim Garba" (4.9 ★, 84 Trips)                       |
|  * Union Badge: "NURTW Kano Central Branch - ID: NURTW/KN/8492"         |
|  * Driver Contact: "0802XXXXXXX" (One-tap call unlocked)                |
|  * Offline Boarding PIN: "5821" (Show driver to board)                  |
|  * In-App SOS / Live Trip Sharing: Active                               |
+-------------------------------------------------------------------------+
```

---

## 3. Server-Side Data Masking Implementation

```typescript
export function projectPublicTrip(trip: any) {
  return {
    id: trip.id,
    originHubName: trip.origin_hub_name,
    originCity: trip.origin_city,
    destinationHubName: trip.destination_hub_name,
    destinationCity: trip.destination_city,
    originHubLatitude: trip.origin_hub_lat,
    originHubLongitude: trip.origin_hub_lng,
    hubRadiusMeters: 250,
    departureTime: trip.departure_time,
    pricePerSeat: trip.price_per_seat,
    availableSeats: trip.available_seats,
    vehicleMake: trip.vehicle_make,
    vehicleModel: trip.vehicle_model,
    vehicleColor: trip.vehicle_color,
    hasAirConditioning: Boolean(trip.has_ac),
    driverRating: trip.driver_rating,
    driverUnionAffiliation: `${trip.union_name} (${trip.union_branch_city} Branch)`,
    isExactLocationLocked: true,
  };
}

export function projectUnlockedBooking(booking: any) {
  return {
    bookingReference: booking.booking_reference,
    paymentStatus: booking.payment_status,
    exactMicroSpot: booking.exact_meeting_point,
    landmarkDirections: booking.landmark_notes,
    vehiclePlateNumber: booking.plate_number,
    driverName: booking.driver_name,
    driverPhone: booking.driver_phone,
    driverUnionBadge: `${booking.union_name} - ${booking.union_membership_number}`,
    offlineBoardingPin: booking.boarding_pin,
    isUnlocked: true,
  };
}
```
