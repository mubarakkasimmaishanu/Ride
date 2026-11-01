import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, runTransaction } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// 1. Reserve seats (10-minute hold with atomic transaction)
export function reserveSeats(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const { tripId, seats = 1 } = req.body;
  const requestedSeats = parseInt(seats, 10);

  if (!tripId || requestedSeats < 1) {
    return res.status(400).json({ success: false, error: { message: 'Trip ID and valid seat count required' } });
  }

  const db = getDatabase();

  try {
    const reservation = runTransaction(() => {
      // 1. Read trip state inside write lock
      const trip = (db.prepare('SELECT id, available_seats, price_per_seat, status FROM trips WHERE id = ?').get as any)(tripId) as any;

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.status !== 'published') {
        throw new Error('Trip is no longer accepting bookings');
      }

      if (trip.available_seats < requestedSeats) {
        throw new Error(`Only ${trip.available_seats} seat(s) remaining on this trip`);
      }

      // 2. Decrement available seats
      const newAvailable = trip.available_seats - requestedSeats;
      const newStatus = newAvailable === 0 ? 'full' : 'published';
      (db.prepare('UPDATE trips SET available_seats = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
        newAvailable,
        newStatus,
        tripId
      );

      // 3. Create reservation hold for 10 minutes
      const reservationId = uuidv4();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      (db.prepare(`
        INSERT INTO seat_reservations (id, trip_id, passenger_id, seats_reserved, expires_at, status)
        VALUES (?, ?, ?, ?, ?, 'held')
      `).run as any)(reservationId, tripId, userId, requestedSeats, expiresAt);

      const totalAmount = requestedSeats * trip.price_per_seat;

      return { reservationId, tripId, seats: requestedSeats, expiresAt, totalAmount };
    });

    return res.status(201).json({ success: true, data: reservation });
  } catch (err: any) {
    return res.status(409).json({ success: false, error: { message: err.message } });
  }
}

// 2. Pay using In-App Wallet (Instant 1-second confirmation)
export function payWithWallet(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const { reservationId } = req.body;

  if (!reservationId) {
    return res.status(400).json({ success: false, error: { message: 'Reservation ID is required' } });
  }

  const db = getDatabase();

  try {
    const confirmation = runTransaction(() => {
      // Find reservation
      const resv = (db.prepare(`
        SELECT r.id, r.trip_id, r.passenger_id, r.seats_reserved, r.status, r.expires_at,
               t.price_per_seat, t.exact_meeting_point, t.landmark_directions,
               v.plate_number, v.make, v.model, v.color,
               u.full_name as driver_name, u.phone_number as driver_phone,
               d.union_name, d.union_membership_number
        FROM seat_reservations r
        JOIN trips t ON r.trip_id = t.id
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE r.id = ? AND r.passenger_id = ?
      `).get as any)(reservationId, userId) as any;

      if (!resv) {
        throw new Error('Reservation not found or does not belong to you');
      }

      if (resv.status !== 'held') {
        throw new Error(`Reservation is already ${resv.status}`);
      }

      const totalAmount = resv.seats_reserved * resv.price_per_seat;

      // Check passenger wallet balance
      const wallet = (db.prepare('SELECT id, balance FROM wallets WHERE user_id = ?').get as any)(userId) as any;
      if (!wallet || wallet.balance < totalAmount) {
        throw new Error(`Insufficient wallet balance. Total is ₦${totalAmount.toLocaleString()}, but wallet balance is ₦${(wallet?.balance || 0).toLocaleString()}`);
      }

      // 1. Debit wallet
      (db.prepare('UPDATE wallets SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
        totalAmount,
        wallet.id
      );

      const bookingRef = 'ZK-' + Math.floor(100000 + Math.random() * 900000);
      const boardingPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit offline PIN
      const bookingId = uuidv4();

      (db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount, reference, description)
        VALUES (?, ?, 'debit_ride_payment', ?, ?, ?)
      `).run as any)(uuidv4(), wallet.id, totalAmount, 'WAL-TX-' + bookingRef, `Payment for ride booking ${bookingRef}`);

      // 2. Mark reservation converted
      (db.prepare("UPDATE seat_reservations SET status = 'converted' WHERE id = ?").run as any)(reservationId);

      // 3. Create booking
      (db.prepare(`
        INSERT INTO bookings (
          id, booking_reference, trip_id, passenger_id, seats_booked, total_amount,
          payment_method, payment_status, booking_status, boarding_pin, meeting_point_revealed_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'wallet', 'paid', 'confirmed', ?, CURRENT_TIMESTAMP)
      `).run as any)(bookingId, bookingRef, resv.trip_id, userId, resv.seats_reserved, totalAmount, boardingPin);

      // 4. Create payment record
      (db.prepare(`
        INSERT INTO payments (id, booking_id, payment_provider, transaction_reference, amount, currency, payment_status, gateway_response, paid_at)
        VALUES (?, ?, 'wallet', ?, ?, 'NGN', 'success', 'Paid via In-App Wallet', CURRENT_TIMESTAMP)
      `).run as any)(uuidv4(), bookingId, 'PAY-' + bookingRef, totalAmount);

      // 5. Increment trip booked_seats
      (db.prepare('UPDATE trips SET booked_seats = booked_seats + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
        resv.seats_reserved,
        resv.trip_id
      );

      return {
        bookingId,
        bookingReference: bookingRef,
        totalAmount,
        boardingPin, // Offline boarding PIN
        exactMeetingPoint: resv.exact_meeting_point,
        landmarkDirections: resv.landmark_directions,
        driver: {
          name: resv.driver_name,
          phone: resv.driver_phone,
          unionBadge: `${resv.union_name} (ID: ${resv.union_membership_number})`,
        },
        vehicle: {
          make: resv.make,
          model: resv.model,
          color: resv.color,
          plateNumber: resv.plate_number,
        }
      };
    });

    return res.json({ success: true, data: confirmation });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
}

// 3. Pay via Paystack (Mock & Real Test Handler)
export function payWithPaystack(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const { reservationId, reference } = req.body;

  if (!reservationId) {
    return res.status(400).json({ success: false, error: { message: 'Reservation ID is required' } });
  }

  const db = getDatabase();

  try {
    const confirmation = runTransaction(() => {
      const resv = (db.prepare(`
        SELECT r.id, r.trip_id, r.passenger_id, r.seats_reserved, r.status,
               t.price_per_seat, t.exact_meeting_point, t.landmark_directions,
               v.plate_number, v.make, v.model, v.color,
               u.full_name as driver_name, u.phone_number as driver_phone,
               d.union_name, d.union_membership_number
        FROM seat_reservations r
        JOIN trips t ON r.trip_id = t.id
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE r.id = ? AND r.passenger_id = ?
      `).get as any)(reservationId, userId) as any;

      if (!resv) {
        throw new Error('Reservation not found or does not belong to you');
      }

      if (resv.status !== 'held') {
        throw new Error(`Reservation is already ${resv.status}`);
      }

      const totalAmount = resv.seats_reserved * resv.price_per_seat;
      const bookingRef = 'ZK-' + Math.floor(100000 + Math.random() * 900000);
      const boardingPin = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingId = uuidv4();
      const paystackRef = reference || 'PSTK-' + Date.now();

      // Convert reservation
      (db.prepare("UPDATE seat_reservations SET status = 'converted' WHERE id = ?").run as any)(reservationId);

      // Create confirmed booking
      (db.prepare(`
        INSERT INTO bookings (
          id, booking_reference, trip_id, passenger_id, seats_booked, total_amount,
          payment_method, payment_status, booking_status, boarding_pin, meeting_point_revealed_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'paystack', 'paid', 'confirmed', ?, CURRENT_TIMESTAMP)
      `).run as any)(bookingId, bookingRef, resv.trip_id, userId, resv.seats_reserved, totalAmount, boardingPin);

      // Record payment
      (db.prepare(`
        INSERT INTO payments (id, booking_id, payment_provider, transaction_reference, amount, currency, payment_status, gateway_response, paid_at)
        VALUES (?, ?, 'paystack', ?, ?, 'NGN', 'success', 'Paystack Verified', CURRENT_TIMESTAMP)
      `).run as any)(uuidv4(), bookingId, paystackRef, totalAmount);

      // Increment booked seats
      (db.prepare('UPDATE trips SET booked_seats = booked_seats + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
        resv.seats_reserved,
        resv.trip_id
      );

      return {
        bookingId,
        bookingReference: bookingRef,
        totalAmount,
        boardingPin,
        exactMeetingPoint: resv.exact_meeting_point,
        landmarkDirections: resv.landmark_directions,
        driver: {
          name: resv.driver_name,
          phone: resv.driver_phone,
          unionBadge: `${resv.union_name} (ID: ${resv.union_membership_number})`,
        },
        vehicle: {
          make: resv.make,
          model: resv.model,
          color: resv.color,
          plateNumber: resv.plate_number,
        }
      };
    });

    return res.json({ success: true, data: confirmation });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
}

// 4. Get Booking Details (Reveals meeting point strictly post-payment)
export function getBookingDetails(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const db = getDatabase();

  const booking = (db.prepare(`
    SELECT b.*,
           t.departure_time, t.exact_meeting_point, t.landmark_directions,
           r.origin_city, r.destination_city,
           oh.name as origin_hub_name, dh.name as destination_hub_name,
           v.make, v.model, v.color, v.plate_number,
           u.full_name as driver_name, u.phone_number as driver_phone,
           d.union_name, d.union_membership_number
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE b.id = ? OR b.booking_reference = ?
  `).get as any)(id, id) as any;

  if (!booking) {
    return res.status(404).json({ success: false, error: { message: 'Booking not found' } });
  }

  // Authorization check
  if (booking.passenger_id !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
  }

  // Privacy projection
  const isPaid = booking.payment_status === 'paid';

  return res.json({
    success: true,
    data: {
      id: booking.id,
      bookingReference: booking.booking_reference,
      seatsBooked: booking.seats_booked,
      totalAmount: booking.total_amount,
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
      departureTime: booking.departure_time,
      originCity: booking.origin_city,
      destinationCity: booking.destination_city,
      originHubName: booking.origin_hub_name,
      destinationHubName: booking.destination_hub_name,
      // Locked vs Unlocked fields
      isMeetingPointUnlocked: isPaid,
      exactMeetingPoint: isPaid ? booking.exact_meeting_point : 'LOCKED - Available only after payment',
      landmarkDirections: isPaid ? booking.landmark_directions : null,
      driverName: isPaid ? booking.driver_name : 'Verified Union Driver',
      driverPhone: isPaid ? booking.driver_phone : null,
      driverUnionBadge: `${booking.union_name} (ID: ${booking.union_membership_number})`,
      vehiclePlateNumber: isPaid ? booking.plate_number : 'LOCKED',
      vehicleMake: booking.make,
      vehicleModel: booking.model,
      vehicleColor: booking.color,
      boardingPin: isPaid ? booking.boarding_pin : null, // 4-digit code for offline boarding
    }
  });
}

// 5. Passenger Booking History
export function getMyBookings(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const db = getDatabase();

  const rawBookings = (db.prepare(`
    SELECT b.*,
           t.departure_time, t.status as trip_status,
           t.exact_meeting_point, t.landmark_directions,
           r.origin_city, r.destination_city, r.distance_km, r.estimated_duration_minutes,
           oh.name as origin_hub_name, dh.name as destination_hub_name,
           v.make, v.model, v.color, v.plate_number, v.has_air_conditioning,
           u.full_name as driver_name, u.phone_number as driver_phone,
           d.union_name, d.union_branch_city, d.union_membership_number, d.average_rating as driver_rating
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    JOIN routes r ON t.route_id = r.id
    JOIN safe_hubs oh ON t.origin_hub_id = oh.id
    JOIN safe_hubs dh ON t.destination_hub_id = dh.id
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE b.passenger_id = ?
    ORDER BY b.created_at DESC
  `).all as any)(userId) as any[];

  const bookings = rawBookings.map(b => {
    const isPaid = b.payment_status === 'paid';
    return {
      ...b,
      bookingReference: b.booking_reference,
      seatsBooked: b.seats_booked,
      totalAmount: b.total_amount,
      paymentStatus: b.payment_status,
      bookingStatus: b.booking_status,
      departureTime: b.departure_time,
      originCity: b.origin_city,
      destinationCity: b.destination_city,
      originHubName: b.origin_hub_name,
      destinationHubName: b.destination_hub_name,
      boardingPin: isPaid ? b.boarding_pin : null,
      exactMeetingPoint: isPaid ? b.exact_meeting_point : null,
      landmarkDirections: isPaid ? b.landmark_directions : null,
      exact_meeting_point: isPaid ? b.exact_meeting_point : undefined,
      driver_phone: isPaid ? b.driver_phone : undefined,
      plate_number: isPaid ? b.plate_number : undefined,
      driver: {
        name: b.driver_name,
        phone: isPaid ? b.driver_phone : undefined,
        rating: b.driver_rating,
        unionBadge: `${b.union_name} (${b.union_branch_city} · ${b.union_membership_number})`,
      },
      vehicle: {
        make: b.make,
        model: b.model,
        color: b.color,
        plateNumber: isPaid ? b.plate_number : 'LOCKED',
        hasAirConditioning: Boolean(b.has_air_conditioning),
      },
    };
  });

  return res.json({ success: true, data: bookings });
}

// 6. Driver Trip Manifest
export function getTripManifest(req: AuthRequest, res: Response) {
  const tripId = req.params.tripId as string;
  const userId = req.user?.id as string;
  const db = getDatabase();

  // Verify driver owns trip
  const trip = (db.prepare(`
    SELECT t.id, d.user_id
    FROM trips t
    JOIN drivers d ON t.driver_id = d.id
    WHERE t.id = ?
  `).get as any)(tripId) as any;

  if (!trip || (trip.user_id !== userId && req.user?.role !== 'admin')) {
    return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const passengers = (db.prepare(`
    SELECT b.id, b.booking_reference, b.seats_booked, b.boarding_pin, b.booking_status, b.created_at,
           u.full_name as passenger_name, u.phone_number as passenger_phone
    FROM bookings b
    JOIN users u ON b.passenger_id = u.id
    WHERE b.trip_id = ? AND b.payment_status = 'paid'
    ORDER BY b.created_at ASC
  `).all as any)(tripId);

  return res.json({ success: true, count: passengers.length, data: passengers });
}
