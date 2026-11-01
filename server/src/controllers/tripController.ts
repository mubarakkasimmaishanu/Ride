import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, runTransaction } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

export function getSafeHubs(req: Request, res: Response) {
  const { city } = req.query;
  const db = getDatabase();

  let query = 'SELECT * FROM safe_hubs WHERE is_active = 1';
  const params: any[] = [];

  if (city && typeof city === 'string') {
    query += ' AND city = ?';
    params.push(city);
  }

  query += ' ORDER BY city, name';
  const hubs = (db.prepare(query).all as any)(...params);

  return res.json({ success: true, data: hubs });
}

export function searchTrips(req: Request, res: Response) {
  const {
    originCity,
    destinationCity,
    date,
    minSeats = '1',
    maxPrice,
    hasAirConditioning,
  } = req.query;

  const db = getDatabase();
  const seatsRequested = parseInt(minSeats as string, 10) || 1;

  let query = `
    SELECT t.id, t.departure_time, t.price_per_seat, t.total_seats,
           t.available_seats, t.booked_seats, t.additional_info, t.status,
           r.origin_city, r.destination_city, r.distance_km, r.estimated_duration_minutes,
           oh.id as origin_hub_id, oh.name as origin_hub_name, oh.latitude as origin_lat, oh.longitude as origin_lng, oh.radius_meters as origin_radius,
           dh.id as destination_hub_id, dh.name as destination_hub_name, dh.latitude as dest_lat, dh.longitude as dest_lng,
           v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color, v.has_air_conditioning, v.exterior_photo_url,
           u.full_name as driver_name, u.profile_photo_url as driver_avatar,
           d.id as driver_id, d.union_name, d.union_branch_city, d.average_rating as driver_rating, d.total_trips_completed
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE t.status = 'published'
      AND t.available_seats >= ?
  `;

  const params: any[] = [seatsRequested];

  if (originCity && typeof originCity === 'string') {
    query += ' AND r.origin_city = ?';
    params.push(originCity);
  }

  if (destinationCity && typeof destinationCity === 'string') {
    query += ' AND r.destination_city = ?';
    params.push(destinationCity);
  }

  if (date && typeof date === 'string') {
    query += ' AND date(t.departure_time) = date(?)';
    params.push(date);
  }

  if (maxPrice && typeof maxPrice === 'string') {
    query += ' AND t.price_per_seat <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (hasAirConditioning === 'true' || hasAirConditioning === '1') {
    query += ' AND v.has_air_conditioning = 1';
  }

  query += ' ORDER BY t.departure_time ASC';

  const trips = (db.prepare(query).all as any)(...params) as any[];

  // Data Projection: Strip confidential fields (exact_meeting_point, driver phone)
  const sanitizedTrips = trips.map(t => ({
    id: t.id,
    departureTime: t.departure_time,
    pricePerSeat: t.price_per_seat,
    totalSeats: t.total_seats,
    availableSeats: t.available_seats,
    bookedSeats: t.booked_seats,
    additionalInfo: t.additional_info,
    status: t.status,
    route: {
      originCity: t.origin_city,
      destinationCity: t.destination_city,
      distanceKm: t.distance_km,
      durationMinutes: t.estimated_duration_minutes,
    },
    originHub: {
      id: t.origin_hub_id,
      name: t.origin_hub_name,
      latitude: t.origin_lat,
      longitude: t.origin_lng,
      radiusMeters: t.origin_radius, // Shaded map circle for pre-payment confidence
    },
    destinationHub: {
      id: t.destination_hub_id,
      name: t.destination_hub_name,
      latitude: t.dest_lat,
      longitude: t.dest_lng,
    },
    vehicle: {
      make: t.vehicle_make,
      model: t.vehicle_model,
      color: t.vehicle_color,
      hasAirConditioning: Boolean(t.has_air_conditioning),
      photoUrl: t.exterior_photo_url,
    },
    driver: {
      name: t.driver_name,
      avatarUrl: t.driver_avatar,
      rating: t.driver_rating,
      tripsCompleted: t.total_trips_completed,
      unionBadge: `${t.union_name} (${t.union_branch_city} Branch)`,
    },
    isMeetingPointLocked: true, // Exact spot unlocks only post-payment
  }));

  return res.json({ success: true, count: sanitizedTrips.length, data: sanitizedTrips });
}

export function getTripById(req: Request, res: Response) {
  const id = req.params.id as string;
  const db = getDatabase();

  const t = (db.prepare(`
    SELECT t.id, t.departure_time, t.price_per_seat, t.total_seats,
           t.available_seats, t.booked_seats, t.additional_info, t.status,
           r.origin_city, r.destination_city, r.distance_km, r.estimated_duration_minutes,
           oh.id as origin_hub_id, oh.name as origin_hub_name, oh.latitude as origin_lat, oh.longitude as origin_lng, oh.radius_meters as origin_radius,
           dh.id as destination_hub_id, dh.name as destination_hub_name, dh.latitude as dest_lat, dh.longitude as dest_lng,
           v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color, v.has_air_conditioning, v.exterior_photo_url,
           u.full_name as driver_name, u.profile_photo_url as driver_avatar,
           d.id as driver_id, d.union_name, d.union_branch_city, d.average_rating as driver_rating, d.total_trips_completed
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE t.id = ?
  `).get as any)(id) as any;

  if (!t) {
    return res.status(404).json({ success: false, error: { message: 'Trip not found' } });
  }

  return res.json({
    success: true,
    data: {
      id: t.id,
      departureTime: t.departure_time,
      pricePerSeat: t.price_per_seat,
      totalSeats: t.total_seats,
      availableSeats: t.available_seats,
      bookedSeats: t.booked_seats,
      additionalInfo: t.additional_info,
      status: t.status,
      route: {
        originCity: t.origin_city,
        destinationCity: t.destination_city,
        distanceKm: t.distance_km,
        durationMinutes: t.estimated_duration_minutes,
      },
      originHub: {
        id: t.origin_hub_id,
        name: t.origin_hub_name,
        latitude: t.origin_lat,
        longitude: t.origin_lng,
        radiusMeters: t.origin_radius,
      },
      destinationHub: {
        id: t.destination_hub_id,
        name: t.destination_hub_name,
        latitude: t.dest_lat,
        longitude: t.dest_lng,
      },
      vehicle: {
        make: t.vehicle_make,
        model: t.vehicle_model,
        color: t.vehicle_color,
        hasAirConditioning: Boolean(t.has_air_conditioning),
        photoUrl: t.exterior_photo_url,
      },
      driver: {
        name: t.driver_name,
        avatarUrl: t.driver_avatar,
        rating: t.driver_rating,
        tripsCompleted: t.total_trips_completed,
        unionBadge: `${t.union_name} (${t.union_branch_city} Branch)`,
      },
      isMeetingPointLocked: true,
    }
  });
}

export function createTrip(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const db = getDatabase();

  // Check driver verification status
  const driver = (db.prepare(`
    SELECT d.id, d.verification_status, v.id as vehicle_id, v.passenger_capacity
    FROM drivers d
    LEFT JOIN vehicles v ON d.id = v.driver_id
    WHERE d.user_id = ?
  `).get as any)(userId) as any;

  if (!driver) {
    return res.status(403).json({ success: false, error: { message: 'Only registered drivers can create trips' } });
  }

  if (driver.verification_status !== 'approved') {
    return res.status(403).json({
      success: false,
      error: { code: 'DRIVER_NOT_APPROVED', message: 'Your driver profile and Union credentials are under review.' }
    });
  }

  if (!driver.vehicle_id) {
    return res.status(400).json({ success: false, error: { message: 'Please register a vehicle before publishing a trip' } });
  }

  const {
    originCity,
    destinationCity,
    originHubId,
    destinationHubId,
    departureTime,
    pricePerSeat,
    exactMeetingPoint,
    landmarkDirections,
    additionalInfo,
    seatsAvailable,
  } = req.body;

  if (!originCity || !destinationCity || !originHubId || !destinationHubId || !departureTime || !pricePerSeat || !exactMeetingPoint) {
    return res.status(400).json({
      success: false,
      error: { message: 'Origin, destination, hubs, departure time, price, and exact meeting point are required' }
    });
  }

  // Find or create route
  const route = (db.prepare('SELECT id FROM routes WHERE origin_city = ? AND destination_city = ?').get as any)(
    originCity,
    destinationCity
  ) as any;

  if (!route) {
    return res.status(400).json({ success: false, error: { message: 'Invalid route corridor' } });
  }

  const tripId = uuidv4();
  const capacity = Math.min(
    seatsAvailable ? parseInt(seatsAvailable) : driver.passenger_capacity,
    driver.passenger_capacity
  );

  (db.prepare(`
    INSERT INTO trips (
      id, driver_id, vehicle_id, route_id, origin_hub_id, destination_hub_id,
      departure_time, price_per_seat, total_seats, available_seats, booked_seats,
      exact_meeting_point, landmark_directions, additional_info, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'published')
  `).run as any)(
    tripId,
    driver.id,
    driver.vehicle_id,
    route.id,
    originHubId,
    destinationHubId,
    departureTime,
    parseFloat(pricePerSeat),
    capacity,
    capacity,
    exactMeetingPoint,
    landmarkDirections || null,
    additionalInfo || null
  );

  return res.status(201).json({
    success: true,
    data: { tripId, message: 'Trip published successfully across corridor!' }
  });
}

export function cancelTrip(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const db = getDatabase();

  const trip = (db.prepare(`
    SELECT t.id, t.driver_id, t.status, d.user_id as driver_user_id
    FROM trips t
    JOIN drivers d ON t.driver_id = d.id
    WHERE t.id = ?
  `).get as any)(id) as any;

  if (!trip) {
    return res.status(404).json({ success: false, error: { message: 'Trip not found' } });
  }

  if (trip.driver_user_id !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Unauthorized to cancel this trip' } });
  }

  let refundedCount = 0;

  runTransaction(() => {
    // 1. Mark trip as cancelled
    (db.prepare("UPDATE trips SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run as any)(id);

    // 2. Find all confirmed/paid bookings to issue instant 1-second wallet refunds
    const bookings = (db.prepare(`
      SELECT b.id, b.passenger_id, b.total_amount, b.booking_reference, w.id as wallet_id
      FROM bookings b
      JOIN wallets w ON b.passenger_id = w.user_id
      WHERE b.trip_id = ? AND b.payment_status = 'paid'
    `).all as any)(id) as any[];

    for (const b of bookings) {
      // Refund into passenger wallet
      (db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
        b.total_amount,
        b.wallet_id
      );

      (db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount, reference, description)
        VALUES (?, ?, 'credit_refund', ?, ?, ?)
      `).run as any)(
        uuidv4(),
        b.wallet_id,
        b.total_amount,
        'REF-' + b.booking_reference,
        `Instant refund for cancelled trip (${b.booking_reference})`
      );

      // Mark booking cancelled
      (db.prepare("UPDATE bookings SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run as any)(b.id);

      refundedCount++;
    }
  });

  return res.json({
    success: true,
    data: {
      message: `Trip cancelled. ${refundedCount} passengers received instant 100% wallet refunds.`,
      refundedCount
    }
  });
}

export function getDriverTrips(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const db = getDatabase();

  const driver = (db.prepare('SELECT id FROM drivers WHERE user_id = ?').get as any)(userId) as any;
  if (!driver) {
    return res.status(403).json({ success: false, error: { message: 'Driver not found' } });
  }

  const trips = (db.prepare(`
    SELECT t.*, r.origin_city, r.destination_city,
           oh.name as origin_hub_name, dh.name as destination_hub_name,
           (SELECT COUNT(*) FROM bookings b WHERE b.trip_id = t.id AND b.payment_status = 'paid') as confirmed_bookings
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    WHERE t.driver_id = ?
    ORDER BY t.departure_time DESC
  `).all as any)(driver.id);

  return res.json({ success: true, data: trips });
}
