import { Request, Response } from 'express';
import { getDatabase } from '../database/connection';

export function getPendingDrivers(req: Request, res: Response) {
  const db = getDatabase();

  const pending = (db.prepare(`
    SELECT d.*, u.full_name, u.phone_number, u.email,
           v.make, v.model, v.year, v.color, v.plate_number, v.passenger_capacity, v.has_air_conditioning,
           v.exterior_photo_url
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN vehicles v ON d.id = v.driver_id
    WHERE d.verification_status = 'pending'
    ORDER BY d.created_at ASC
  `).all as any)();

  return res.json({ success: true, count: pending.length, data: pending });
}

export function verifyDriver(req: Request, res: Response) {
  const id = req.params.id as string;
  const { status, notes } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: { message: 'Status must be approved or rejected' } });
  }

  const db = getDatabase();
  const driver = (db.prepare('SELECT id FROM drivers WHERE id = ?').get as any)(id);

  if (!driver) {
    return res.status(404).json({ success: false, error: { message: 'Driver not found' } });
  }

  (db.prepare(`
    UPDATE drivers 
    SET verification_status = ?, verification_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run as any)(status, notes || null, id);

  return res.json({
    success: true,
    data: {
      driverId: id,
      status,
      message: `Driver status updated to ${status}`
    }
  });
}

export function getPlatformAnalytics(req: Request, res: Response) {
  const db = getDatabase();

  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'passenger'").get() as any).count;
  const totalDrivers = (db.prepare('SELECT COUNT(*) as count FROM drivers').get() as any).count;
  const approvedDrivers = (db.prepare("SELECT COUNT(*) as count FROM drivers WHERE verification_status = 'approved'").get() as any).count;
  const pendingDrivers = (db.prepare("SELECT COUNT(*) as count FROM drivers WHERE verification_status = 'pending'").get() as any).count;
  
  const totalTrips = (db.prepare('SELECT COUNT(*) as count FROM trips').get() as any).count;
  const activeTrips = (db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'published'").get() as any).count;
  const completedTrips = (db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'completed'").get() as any).count;

  const totalBookings = (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'paid'").get() as any).count;
  
  const financial = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as gbv
    FROM payments
    WHERE payment_status = 'success'
  `).get() as any;

  const gbv = financial?.gbv || 0;
  const platformRevenue = gbv * 0.10; // 10% platform commission

  return res.json({
    success: true,
    data: {
      users: {
        passengers: totalUsers,
        totalDrivers,
        approvedDrivers,
        pendingDrivers,
      },
      trips: {
        total: totalTrips,
        active: activeTrips,
        completed: completedTrips,
      },
      bookings: {
        totalPaid: totalBookings,
        grossBookingVolume: gbv,
        platformCommission: platformRevenue,
      }
    }
  });
}
