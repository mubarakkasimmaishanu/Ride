import { getDatabase, runTransaction } from '../database/connection';

export function sweepExpiredReservations(): number {
  const db = getDatabase();

  try {
    const expiredCount = runTransaction(() => {
      // Find expired holds
      const expired = db.prepare(`
        SELECT id, trip_id, seats_reserved 
        FROM seat_reservations 
        WHERE status = 'held' AND datetime(expires_at) <= datetime('now')
      `).all() as any[];

      if (expired.length === 0) return 0;

      for (const hold of expired) {
        // 1. Mark reservation expired
        db.prepare("UPDATE seat_reservations SET status = 'expired' WHERE id = ?").run(hold.id);

        // 2. Return seats to trip pool
        db.prepare(`
          UPDATE trips 
          SET available_seats = available_seats + ?,
              status = CASE WHEN status = 'full' THEN 'published' ELSE status END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(hold.seats_reserved, hold.trip_id);
      }

      return expired.length;
    });

    if (expiredCount > 0) {
      console.log(`🧹 Swept ${expiredCount} expired seat reservation(s) back to inventory`);
    }

    return expiredCount;
  } catch (err: any) {
    console.error('Error in reservation expiration sweep:', err.message);
    return 0;
  }
}

export function startExpirationWorker(intervalMs = 30000) {
  console.log(`⏱️ Seat reservation expiration worker started (Interval: ${intervalMs / 1000}s)`);
  setInterval(sweepExpiredReservations, intervalMs);
}
