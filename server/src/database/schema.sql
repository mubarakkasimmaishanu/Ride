-- ============================================================================
-- Zaria - Kaduna - Kano Ride-Sharing Platform Database Schema
-- SQLite (WAL Mode) Engine
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Users table (Passengers, Drivers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('passenger', 'driver', 'admin')),
    profile_photo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. In-App Wallets (Instant 1-second refunds & credits)
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL REFERENCES wallets(id),
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('credit_refund', 'credit_compensation', 'debit_ride_payment', 'debit_withdrawal', 'credit_deposit')),
    amount REAL NOT NULL,
    reference TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Drivers table (Includes mandatory Road Transport Union accreditation)
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    driver_type TEXT NOT NULL DEFAULT 'private_owner' CHECK(driver_type IN ('private_owner', 'authorized_workshop', 'dealer')),
    license_number TEXT NOT NULL,
    nin TEXT NOT NULL,
    -- Road Transport Union Credentials
    union_name TEXT NOT NULL CHECK(union_name IN ('NURTW', 'RTEAN', 'STATE_UNION', 'OTHER')),
    union_branch_city TEXT NOT NULL CHECK(union_branch_city IN ('Zaria', 'Kaduna', 'Kano')),
    union_membership_number TEXT NOT NULL,
    union_slip_photo_url TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    total_trips_completed INTEGER NOT NULL DEFAULT 0,
    average_rating REAL NOT NULL DEFAULT 5.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT NOT NULL,
    plate_number TEXT NOT NULL UNIQUE,
    passenger_capacity INTEGER NOT NULL DEFAULT 4,
    has_air_conditioning INTEGER NOT NULL DEFAULT 1,
    exterior_photo_url TEXT,
    interior_photo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Designated Safe Hubs (Kaduna, Zaria, Kano)
CREATE TABLE IF NOT EXISTS safe_hubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL CHECK(city IN ('Zaria', 'Kaduna', 'Kano')),
    landmark_category TEXT NOT NULL, -- 'university_gate', 'filling_station_forecourt', 'commercial_complex'
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 250,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 6. Routes table (Tri-City Corridor Network)
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    origin_city TEXT NOT NULL CHECK(origin_city IN ('Zaria', 'Kaduna', 'Kano')),
    destination_city TEXT NOT NULL CHECK(destination_city IN ('Zaria', 'Kaduna', 'Kano')),
    distance_km REAL NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT chk_different_cities CHECK (origin_city != destination_city)
);

-- 7. Trips table
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id),
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
    route_id TEXT NOT NULL REFERENCES routes(id),
    origin_hub_id TEXT NOT NULL REFERENCES safe_hubs(id),
    destination_hub_id TEXT NOT NULL REFERENCES safe_hubs(id),
    departure_time DATETIME NOT NULL,
    price_per_seat REAL NOT NULL,       -- Includes ₦150 micro-insurance fee
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    booked_seats INTEGER NOT NULL DEFAULT 0,
    exact_meeting_point TEXT NOT NULL,  -- Confidential: Unlocked post-payment
    landmark_directions TEXT,           -- Specific micro-spot hints
    additional_info TEXT,               -- e.g. 'AC on, moderate luggage only'
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'full', 'in_transit', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Temporary Seat Holds (10-minute checkout timer)
CREATE TABLE IF NOT EXISTS seat_reservations (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL REFERENCES trips(id),
    passenger_id TEXT NOT NULL REFERENCES users(id),
    seats_reserved INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held', 'converted', 'expired', 'released')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_reference TEXT NOT NULL UNIQUE,
    trip_id TEXT NOT NULL REFERENCES trips(id),
    passenger_id TEXT NOT NULL REFERENCES users(id),
    seats_booked INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('wallet', 'paystack', 'flutterwave')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK(booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    boarding_pin TEXT NOT NULL,           -- 4-digit code for offline boarding verification
    meeting_point_revealed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    payment_provider TEXT NOT NULL CHECK(payment_provider IN ('wallet', 'paystack', 'flutterwave')),
    transaction_reference TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'success', 'failed')),
    gateway_response TEXT,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_route_time ON trips(route_id, departure_time, status);
CREATE INDEX IF NOT EXISTS idx_trips_hubs ON trips(origin_hub_id, destination_hub_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_drivers_union ON drivers(union_branch_city, verification_status);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_status ON seat_reservations(status, expires_at);
