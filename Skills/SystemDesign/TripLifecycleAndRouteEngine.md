# Zaria–Kaduna–Kano Ride-Sharing Platform - Trip Lifecycle & Route Engine Skill

Used for governing trip lifecycle state transitions, route dispatching, passenger search filtering, and multi-city corridor routing across **Zaria, Kaduna, and Kano**.

---

## 1. Tri-City Corridor Topology & Landmark Nodes

The platform operates across three connected Northern corridors with pre-approved Safe Hubs located outside commercial motor park boundaries:

```
                            ┌────────────────────────┐
                            │      KANO METROPOLIS   │
                            │  (Naibawa, BUK, State) │
                            └───────────┬────────────┘
                                        ▲
                         140 km (~2 hrs)│ 210 km (~3 hrs)
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
┌────────────────────────┐                                ┌────────────────────────┐
│     ZARIA METROPOLIS   │ <────── 78 km (~75 mins) ─────>│   KADUNA METROPOLIS    │
│ (Kwangila, ABU Samaru) │                                │ (Kawo, Command Junc.)  │
└────────────────────────┘                                └────────────────────────┘
```

### Approved Safe Hub Nodes by City

#### 1. Zaria Nodes
* **ABU Samaru Main Gate Hub**: University faculty, students, and research staff.
* **Kongo Campus Gate Hub**: Legal, administrative, and local commuters.
* **Total Filling Station Forecourt (Kwangila Bypass)**: Safe commercial forecourt off Kwangila flyover.
* **Nuhu Bamalli Polytechnic Hub**: Southern Zaria departure node.

#### 2. Kaduna Nodes
* **Dialogue Pharmacy Kawo Bypass Hub**: North Kaduna node; bypasses inner Kawo motor park congestion.
* **Command Junction Commercial Complex**: Southern bypass and Barnawa/Narayi travelers.
* **NNPC Mega Station Hub (Ahmadu Bello Way)**: Central Kaduna business district.

#### 3. Kano Nodes
* **Naibawa Flyover Bypass Hub (Zaria Road)**: The primary southern gateway into Kano; safe roadside service lane.
* **Bayero University Kano (BUK New Campus Gate Hub)**: Premier university hub along Western bypass.
* **Silver Jubilee Flyover / State Road Hub**: Central Kano access near government and commercial centers.
* **Dawanau Bypass Hub**: Northern gateway serving international traders and agricultural merchants.

---

## 2. Trip Lifecycle Finite State Machine

```
   ┌───────────┐
   │   DRAFT   │
   └─────┬─────┘
         │ Driver clicks "Publish Trip"
         ▼
 ┌───────────────┐        All Seats Booked        ┌────────────┐
 │   PUBLISHED   │ ─────────────────────────────> │    FULL    │
 └───────┬───────┘                                └─────┬──────┘
         │                                              │
         │ Seat Cancelled / Released                    │
         │ <────────────────────────────────────────────┘
         │
         │ Driver Departs Pickup Safe Hub
         ▼
 ┌───────────────┐
 │  IN_TRANSIT   │
 └───────┬───────┘
         │ Driver Arrives at Destination Safe Hub
         ▼
 ┌───────────────┐
 │   COMPLETED   │ ───> Driver Wallet Credited with Net Payout
 └───────────────┘
```

---

## 3. Search & Filter Query Engine

```typescript
export interface TriCitySearchParams {
  originCity: 'Zaria' | 'Kaduna' | 'Kano';
  destinationCity: 'Zaria' | 'Kaduna' | 'Kano';
  date: string;          // 'YYYY-MM-DD'
  minSeats?: number;     // Defaults to 1
  maxPrice?: number;
  hasAirConditioning?: boolean;
}

export function searchTriCityTrips(params: TriCitySearchParams) {
  let query = `
    SELECT t.id, t.departure_time, t.price_per_seat, t.total_seats, 
           t.available_seats, t.booked_seats, t.status,
           oh.name as origin_hub_name, oh.city as origin_city,
           dh.name as destination_hub_name, dh.city as destination_city,
           v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color,
           v.has_air_conditioning,
           u.full_name as driver_name, u.profile_photo_url as driver_avatar,
           d.union_name, d.union_branch_city, d.average_rating as driver_rating,
           d.total_trips_completed
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE r.origin_city = ? 
      AND r.destination_city = ?
      AND t.status = 'published'
      AND t.available_seats >= ?
      AND date(t.departure_time) = date(?)
      AND datetime(t.departure_time) > datetime('now', '+15 minutes')
  `;

  const bindings: any[] = [
    params.originCity,
    params.destinationCity,
    params.minSeats || 1,
    params.date,
  ];

  if (params.maxPrice) {
    query += ` AND t.price_per_seat <= ?`;
    bindings.push(params.maxPrice);
  }

  if (params.hasAirConditioning) {
    query += ` AND v.has_air_conditioning = 1`;
  }

  query += ` ORDER BY t.departure_time ASC`;

  return db.prepare(query).all(...bindings);
}
```
