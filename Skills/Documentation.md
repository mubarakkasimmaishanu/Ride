# Zaria–Kaduna–Kano Ride-Sharing Platform - Documentation Skill

Used for generating, maintaining, and formatting technical guides, API references, mobile build steps, and environment setup documentation for the **Zaria–Kaduna–Kano Ride-Sharing & Seat Booking Platform**.

---

## 1. Quick-Start & Development Environment Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher.
* **Package Manager**: npm or yarn.
* **Expo CLI**: `npx expo` (bundled with project).
* **Mobile Test Device**: Expo Go app installed on Android/iOS device OR Android Studio Emulator.

### Repository Structure
```
ride/
├── skills.json
├── Skills/
│   ├── Remember.md
│   ├── Architect.md
│   ├── Security.md
│   ├── Registration.md
│   ├── Finance.md
│   ├── Testing.md
│   ├── Review.md
│   ├── Debug.md
│   ├── Documentation.md
│   ├── Competitors.md
│   └── SystemDesign/
│       ├── UserHierarchy.md
│       ├── SeatInventoryAndConcurrency.md
│       ├── MeetingPointPrivacyAndReveal.md
│       ├── TripLifecycleAndRouteEngine.md
│       └── PaymentWorkflowAndReconciliation.md
├── server/                      # Lightweight Node.js/Express SQLite backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── database/            # SQLite connection, migrations, and seeds
│   │   └── routes/
│   └── package.json
└── client/                      # React Native Expo application
    ├── app/                     # Expo Router screens
    ├── components/              # UI components (VehicleCard, SeatSelector, etc.)
    ├── services/                # API client & Paystack checkout
    └── package.json
```

---

## 2. Realistic Seed Data for Tri-City Corridors

The automated database seeder populates realistic multi-corridor data with accredited union drivers:

### 1. Zaria $\longleftrightarrow$ Kaduna Corridor (~78 km)
* **Trip 1 (Zaria $\to$ Kaduna)**:
  * **Origin Hub**: Total Filling Station Forecourt, Kwangila Bypass, Zaria.
  * **Destination Hub**: Dialogue Pharmacy Kawo Bypass Hub, Kaduna.
  * **Departure**: 07:30 AM | Price: ₦2,000 per seat.
  * **Vehicle**: Silver Toyota Corolla (Plate: `KDT-381-AA`, 3 seats).
  * **Driver**: Ahmed Bello (Auto Painter, NURTW Kwangila Branch ID: `NURTW/ZR/4910`).

### 2. Zaria $\longleftrightarrow$ Kano Corridor (~140 km)
* **Trip 2 (Zaria $\to$ Kano)**:
  * **Origin Hub**: ABU Samaru Main Gate Hub, Zaria.
  * **Destination Hub**: BUK New Campus Main Gate Hub, Kano.
  * **Departure**: 08:30 AM | Price: ₦3,000 per seat (Full AC).
  * **Vehicle**: Wine Red Toyota Camry 2013 (Plate: `KAN-719-BB`, 4 seats).
  * **Driver**: Dr. Ibrahim Garba (Visiting Lecturer, NURTW Zaria Central Branch).

### 3. Kaduna $\longleftrightarrow$ Kano Corridor (~210 km)
* **Trip 3 (Kaduna $\to$ Kano)**:
  * **Origin Hub**: Command Junction Commercial Complex, Kaduna.
  * **Destination Hub**: Naibawa Flyover Bypass Hub, Kano.
  * **Departure**: 09:00 AM | Price: ₦4,500 per seat.
  * **Vehicle**: Black Toyota Matrix (Plate: `KDG-812-ZZ`, 4 seats).
  * **Driver**: Sani Mohammed (Auto Parts Dealer, RTEAN Kaduna Branch ID: `RTEAN/KD/1029`).

---

## 3. Environment Variables Contract

### Backend `.env`
```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/ride.sqlite
JWT_SECRET=super-secret-zaria-kaduna-kano-jwt-key-2026
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key_here
BASE_URL=http://localhost:3000
```

### Mobile App Client `.env`
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1    # For Android Emulator
# EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1 # For Physical Device
EXPO_PUBLIC_PAYSTACK_KEY=your_paystack_public_key_here
```
