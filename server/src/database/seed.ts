import { getDatabase, runTransaction } from './connection';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function runSeed() {
  const db = getDatabase();
  console.log('🌱 Starting database seeding for Zaria-Kaduna-Kano...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  runTransaction(() => {
    // 1. Safe Hubs
    const hubs = [
      // Zaria
      { id: 'hub-zr-samaru', name: 'ABU Samaru Main Gate Hub', city: 'Zaria', category: 'university_gate', lat: 11.155, lng: 7.649 },
      { id: 'hub-zr-kwangila', name: 'Total Station Forecourt (Kwangila)', city: 'Zaria', category: 'filling_station_forecourt', lat: 11.085, lng: 7.718 },
      { id: 'hub-zr-kongo', name: 'Kongo Campus Gate Hub', city: 'Zaria', category: 'university_gate', lat: 11.071, lng: 7.712 },
      { id: 'hub-zr-bamalli', name: 'Nuhu Bamalli Polytechnic Hub', city: 'Zaria', category: 'university_gate', lat: 11.041, lng: 7.688 },
      // Kaduna
      { id: 'hub-kd-kawo', name: 'Dialogue Pharmacy Kawo Bypass Hub', city: 'Kaduna', category: 'commercial_complex', lat: 10.573, lng: 7.448 },
      { id: 'hub-kd-command', name: 'Command Junction Commercial Complex', city: 'Kaduna', category: 'commercial_complex', lat: 10.458, lng: 7.425 },
      { id: 'hub-kd-nnpc', name: 'NNPC Mega Station Hub', city: 'Kaduna', category: 'filling_station_forecourt', lat: 10.518, lng: 7.438 },
      // Kano
      { id: 'hub-kn-naibawa', name: 'Naibawa Flyover Bypass Hub', city: 'Kano', category: 'commercial_complex', lat: 11.942, lng: 8.529 },
      { id: 'hub-kn-buk', name: 'BUK New Campus Main Gate Hub', city: 'Kano', category: 'university_gate', lat: 11.978, lng: 8.423 },
      { id: 'hub-kn-silver', name: 'Silver Jubilee State Road Hub', city: 'Kano', category: 'commercial_complex', lat: 11.996, lng: 8.531 },
      { id: 'hub-kn-dawanau', name: 'Dawanau Bypass Hub', city: 'Kano', category: 'commercial_complex', lat: 12.089, lng: 8.436 },
    ];

    const insertHub = db.prepare(`
      INSERT INTO safe_hubs (id, name, city, landmark_category, latitude, longitude, radius_meters)
      VALUES (?, ?, ?, ?, ?, ?, 250)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, latitude=excluded.latitude, longitude=excluded.longitude
    `);
    hubs.forEach(h => insertHub.run(h.id, h.name, h.city, h.category, h.lat, h.lng));

    // 2. Routes
    const routes = [
      { id: 'route-zr-kd', origin: 'Zaria', dest: 'Kaduna', km: 78, mins: 75 },
      { id: 'route-kd-zr', origin: 'Kaduna', dest: 'Zaria', km: 78, mins: 75 },
      { id: 'route-zr-kn', origin: 'Zaria', dest: 'Kano', km: 140, mins: 120 },
      { id: 'route-kn-zr', origin: 'Kano', dest: 'Zaria', km: 140, mins: 120 },
      { id: 'route-kd-kn', origin: 'Kaduna', dest: 'Kano', km: 210, mins: 180 },
      { id: 'route-kn-kd', origin: 'Kano', dest: 'Kaduna', km: 210, mins: 180 },
    ];

    const insertRoute = db.prepare(`
      INSERT INTO routes (id, origin_city, destination_city, distance_km, estimated_duration_minutes)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET distance_km=excluded.distance_km, estimated_duration_minutes=excluded.estimated_duration_minutes
    `);
    routes.forEach(r => insertRoute.run(r.id, r.origin, r.dest, r.km, r.mins));

    // 3. Admin User
    const adminId = 'user-admin-01';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Platform Administrator', '08000000000', 'admin@ride.ng', ?, 'admin')
    `).run(adminId, passwordHash);

    // 4. Passenger User + In-App Wallet
    const passengerId = 'user-passenger-01';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Amina Yusuf', '08011112222', 'amina@gmail.com', ?, 'passenger')
    `).run(passengerId, passwordHash);

    const walletId = 'wallet-passenger-01';
    db.prepare(`
      INSERT OR IGNORE INTO wallets (id, user_id, balance, currency)
      VALUES (?, ?, 15000.0, 'NGN')
    `).run(walletId, passengerId);

    // Initial deposit transaction
    db.prepare(`
      INSERT OR IGNORE INTO wallet_transactions (id, wallet_id, transaction_type, amount, reference, description)
      VALUES (?, ?, 'credit_deposit', 15000.0, 'REF-INIT-DEPOSIT-01', 'Initial welcome wallet funding')
    `).run(uuidv4(), walletId);

    // 5. Driver 1: Ahmed Bello (Zaria Auto Painter, NURTW Kwangila)
    const driverUser1 = 'user-driver-01';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Ahmed Bello', '08033334444', 'ahmed.bello@gmail.com', ?, 'driver')
    `).run(driverUser1, passwordHash);

    const driver1 = 'driver-01';
    db.prepare(`
      INSERT OR IGNORE INTO drivers (id, user_id, driver_type, license_number, nin, union_name, union_branch_city, union_membership_number, union_slip_photo_url, verification_status, total_trips_completed, average_rating)
      VALUES (?, ?, 'authorized_workshop', 'DL-ZR-84920', 'NIN-19482019482', 'NURTW', 'Zaria', 'NURTW/ZR/4910', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', 'approved', 42, 4.9)
    `).run(driver1, driverUser1);

    const vehicle1 = 'vehicle-01';
    db.prepare(`
      INSERT OR IGNORE INTO vehicles (id, driver_id, make, model, year, color, plate_number, passenger_capacity, has_air_conditioning, exterior_photo_url)
      VALUES (?, ?, 'Toyota', 'Corolla', 2012, 'Silver', 'KDT-381-AA', 3, 1, 'https://images.unsplash.com/photo-1590362891991-f776e747a588')
    `).run(vehicle1, driver1);

    // Driver 2: Dr. Ibrahim Garba (Lecturer, NURTW Kano Central)
    const driverUser2 = 'user-driver-02';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Dr. Ibrahim Garba', '08055556666', 'i.garba@buk.edu.ng', ?, 'driver')
    `).run(driverUser2, passwordHash);

    const driver2 = 'driver-02';
    db.prepare(`
      INSERT OR IGNORE INTO drivers (id, user_id, driver_type, license_number, nin, union_name, union_branch_city, union_membership_number, union_slip_photo_url, verification_status, total_trips_completed, average_rating)
      VALUES (?, ?, 'private_owner', 'DL-KN-39482', 'NIN-77392018492', 'NURTW', 'Kano', 'NURTW/KN/8492', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', 'approved', 84, 4.9)
    `).run(driver2, driverUser2);

    const vehicle2 = 'vehicle-02';
    db.prepare(`
      INSERT OR IGNORE INTO vehicles (id, driver_id, make, model, year, color, plate_number, passenger_capacity, has_air_conditioning, exterior_photo_url)
      VALUES (?, ?, 'Toyota', 'Camry', 2014, 'Wine Red', 'KAN-719-BB', 4, 1, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb')
    `).run(vehicle2, driver2);

    // Driver 3: Sani Mohammed (Auto Parts Dealer, RTEAN Kaduna)
    const driverUser3 = 'user-driver-03';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Sani Mohammed', '08077778888', 'sani.parts@gmail.com', ?, 'driver')
    `).run(driverUser3, passwordHash);

    const driver3 = 'driver-03';
    db.prepare(`
      INSERT OR IGNORE INTO drivers (id, user_id, driver_type, license_number, nin, union_name, union_branch_city, union_membership_number, union_slip_photo_url, verification_status, total_trips_completed, average_rating)
      VALUES (?, ?, 'dealer', 'DL-KD-99482', 'NIN-55281940291', 'RTEAN', 'Kaduna', 'RTEAN/KD/1029', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', 'approved', 19, 4.8)
    `).run(driver3, driverUser3);

    const vehicle3 = 'vehicle-03';
    db.prepare(`
      INSERT OR IGNORE INTO vehicles (id, driver_id, make, model, year, color, plate_number, passenger_capacity, has_air_conditioning, exterior_photo_url)
      VALUES (?, ?, 'Toyota', 'Matrix', 2011, 'Black', 'KDG-812-ZZ', 4, 1, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d')
    `).run(vehicle3, driver3);

    // 6. Active Trips
    const now = new Date();
    const trip1Time = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const trip2Time = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    const trip3Time = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const trip4Time = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

    const insertTrip = db.prepare(`
      INSERT INTO trips (
        id, driver_id, vehicle_id, route_id, origin_hub_id, destination_hub_id,
        departure_time, price_per_seat, total_seats, available_seats, booked_seats,
        exact_meeting_point, landmark_directions, additional_info, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
      ON CONFLICT(id) DO UPDATE SET
        departure_time = excluded.departure_time,
        price_per_seat = excluded.price_per_seat,
        exact_meeting_point = excluded.exact_meeting_point,
        landmark_directions = excluded.landmark_directions,
        additional_info = excluded.additional_info,
        status = 'published'
    `);

    // Trip 1: Zaria (Kwangila) -> Kaduna (Kawo)
    insertTrip.run(
      'trip-01', driver1, vehicle1, 'route-zr-kd', 'hub-zr-kwangila', 'hub-kd-kawo',
      trip1Time, 2000.0, 3, 2, 1,
      'Parked beside the Total filling station main office, behind the tyre service shed.',
      'Look for the silver Corolla with hazard lights on. Driver wearing grey kaftan.',
      'Delivering freshly oven-baked car to Kaduna client. Cool AC on, light luggage only.'
    );

    // Trip 2: Zaria (Samaru ABU) -> Kano (BUK New Campus)
    insertTrip.run(
      'trip-02', driver2, vehicle2, 'route-zr-kn', 'hub-zr-samaru', 'hub-kn-buk',
      trip2Time, 3000.0, 4, 3, 1,
      'Parked directly opposite the GTBank ATM gallery at ABU Samaru North Gate.',
      'Wine Red Camry parked under the neem shade tree.',
      'Direct highway trip to BUK New Campus Gate. Very comfortable, clean interior.'
    );

    // Trip 3: Kaduna (Command Junction) -> Kano (Naibawa)
    insertTrip.run(
      'trip-03', driver3, vehicle3, 'route-kd-kn', 'hub-kd-command', 'hub-kn-naibawa',
      trip3Time, 4500.0, 4, 4, 0,
      'Front of the shopping plaza directly at Command Junction bypass.',
      'Black Toyota Matrix parked beside the pharmacy.',
      'Heading to Kano auto parts market. Boot space available for moderate luggage.'
    );

    // Return evening trip back to Zaria Kwangila
    insertTrip.run(
      'trip-04', driver1, vehicle1, 'route-kn-zr', 'hub-kn-naibawa', 'hub-zr-kwangila',
      trip4Time, 3000.0, 3, 2, 1,
      'Beside the pedestrian bridge service lane at Naibawa Flyover, Kano.',
      'Driver waiting with hazard lights.',
      'Return evening trip back to Zaria Kwangila.'
    );

    const trip5Time = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
    const trip6Time = new Date(now.getTime() + 150 * 60 * 1000).toISOString();
    const trip7Time = new Date(now.getTime() + 210 * 60 * 1000).toISOString();
    const trip8Time = new Date(now.getTime() + 300 * 60 * 1000).toISOString();

    // Trip 5: Zaria (ABU Samaru) -> Kaduna (NNPC Mega) — Executive Ride
    insertTrip.run(
      'trip-05', driver2, vehicle2, 'route-zr-kd', 'hub-zr-samaru', 'hub-kd-nnpc',
      trip5Time, 2800.0, 4, 3, 1,
      'Opposite Senate Building exit gate inside ABU Samaru Main Gate forecourt.',
      'Wine Red Camry 2014, full Dual-Zone AC.',
      'Executive non-stop express to Kaduna Central CBD. Quiet ride, laptop-friendly.'
    );

    // Trip 6: Kaduna (Kawo Bypass) -> Zaria (ABU Samaru)
    insertTrip.run(
      'trip-06', driver3, vehicle3, 'route-kd-zr', 'hub-kd-kawo', 'hub-zr-samaru',
      trip6Time, 2200.0, 4, 3, 1,
      'Parked directly in front of Dialogue Pharmacy forecourt off Kawo Flyover.',
      'Black Toyota Matrix, chilled AC.',
      'Smooth express highway cruise to Zaria Samaru.'
    );

    // Trip 7: Kano (BUK New Campus) -> Kaduna (Kawo Bypass)
    insertTrip.run(
      'trip-07', driver2, vehicle2, 'route-kn-kd', 'hub-kn-buk', 'hub-kd-kawo',
      trip7Time, 4800.0, 4, 2, 2,
      'BUK New Campus security plaza visitor parking bay.',
      'Wine Red Toyota Camry, plate ending BB.',
      'Direct Kano–Zaria–Kaduna expressway run, full AC.'
    );

    // Trip 8: Zaria (Kongo) -> Kaduna (Command Junction) — Economy Saloon
    insertTrip.run(
      'trip-08', driver3, vehicle3, 'route-zr-kd', 'hub-zr-kongo', 'hub-kd-command',
      trip8Time, 1800.0, 4, 4, 0,
      'Inside Kongo Campus security lay-by near Fidelity ATM.',
      'Black Matrix parked by the shade.',
      'Budget-friendly shared saloon to Southern Kaduna bypass.'
    );

    // Pending Drivers for Admin Union Verification Demo
    const pendingUser1 = 'user-driver-pending-01';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, full_name, phone_number, email, password_hash, role)
      VALUES (?, 'Musa Abdullahi', '08099991111', 'musa.abdullahi@gmail.com', ?, 'driver')
    `).run(pendingUser1, passwordHash);

    db.prepare(`
      INSERT OR IGNORE INTO drivers (id, user_id, driver_type, license_number, nin, union_name, union_branch_city, union_membership_number, union_slip_photo_url, verification_status)
      VALUES ('driver-pending-01', ?, 'private_owner', 'DL-ZR-55210', 'NIN-30192837465', 'NURTW', 'Zaria', 'NURTW/ZR/7741', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957', 'pending')
    `).run(pendingUser1);

    db.prepare(`
      INSERT OR IGNORE INTO vehicles (id, driver_id, make, model, year, color, plate_number, passenger_capacity, has_air_conditioning)
      VALUES ('vehicle-pending-01', 'driver-pending-01', 'Honda', 'Accord', 2015, 'Midnight Blue', 'ZRA-409-KD', 4, 1)
    `).run();

    // 7. Seed an existing Confirmed Booking for passenger Amina on Trip 1
    const booking1Id = 'booking-seed-01';
    db.prepare(`
      INSERT OR IGNORE INTO bookings (
        id, booking_reference, trip_id, passenger_id, seats_booked, total_amount,
        payment_method, payment_status, booking_status, boarding_pin, meeting_point_revealed_at
      ) VALUES (?, 'ZK-202611-01', 'trip-01', ?, 1, 2000.0, 'wallet', 'paid', 'confirmed', '8492', CURRENT_TIMESTAMP)
    `).run(booking1Id, passengerId);

    db.prepare(`
      INSERT OR IGNORE INTO payments (
        id, booking_id, payment_provider, transaction_reference, amount, currency, payment_status, gateway_response, paid_at
      ) VALUES (?, ?, 'wallet', 'WAL-TX-84920', 2000.0, 'NGN', 'success', 'Paid via In-App Wallet', CURRENT_TIMESTAMP)
    `).run(uuidv4(), booking1Id);

    console.log('✅ Seeding completed successfully!');
  });
}

// Execute if run directly
if (require.main === module) {
  runSeed();
}
