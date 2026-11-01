import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase } from './database/connection';
import { runSeed } from './database/seed';
import { requireAuth, requireRole } from './middleware/auth';
import * as authController from './controllers/authController';
import * as tripController from './controllers/tripController';
import * as bookingController from './controllers/bookingController';
import * as adminController from './controllers/adminController';
import { startExpirationWorker } from './services/expirationWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database
const db = getDatabase();

// Check if safe_hubs is populated; if not, auto-seed
const hubCount = (db.prepare('SELECT COUNT(*) as count FROM safe_hubs').get() as any)?.count || 0;
if (hubCount === 0) {
  console.log('⚡ Empty database detected. Running initial seed...');
  runSeed();
}

// Start background seat reservation cleanup worker
startExpirationWorker(30000);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Zaria-Kaduna-Kano Ride-Sharing API',
    corridors: ['Zaria <-> Kaduna', 'Zaria <-> Kano', 'Kaduna <-> Kano'],
    timestamp: new Date().toISOString()
  });
});

// --- Auth Routes ---
app.post('/api/v1/auth/register', authController.register);
app.post('/api/v1/auth/login', authController.login);
app.get('/api/v1/auth/profile', requireAuth, authController.getProfile);
app.post('/api/v1/auth/wallet/deposit', requireAuth, authController.depositToWallet);
app.get('/api/v1/auth/wallet/transactions', requireAuth, authController.getWalletTransactions);

// --- Trip Routes ---
app.get('/api/v1/trips/safe-hubs', tripController.getSafeHubs);
app.get('/api/v1/trips/search', tripController.searchTrips);
app.get('/api/v1/trips/:id', tripController.getTripById);
app.post('/api/v1/trips', requireAuth, requireRole(['driver', 'admin']), tripController.createTrip);
app.post('/api/v1/trips/:id/cancel', requireAuth, tripController.cancelTrip);
app.get('/api/v1/driver/my-trips', requireAuth, requireRole(['driver', 'admin']), tripController.getDriverTrips);

// --- Booking & Payment Routes ---
app.post('/api/v1/bookings/reserve', requireAuth, bookingController.reserveSeats);
app.post('/api/v1/bookings/pay/wallet', requireAuth, bookingController.payWithWallet);
app.post('/api/v1/bookings/pay/paystack', requireAuth, bookingController.payWithPaystack);
app.get('/api/v1/bookings/my-bookings', requireAuth, bookingController.getMyBookings);
app.get('/api/v1/bookings/:id', requireAuth, bookingController.getBookingDetails);
app.get('/api/v1/bookings/manifest/:tripId', requireAuth, requireRole(['driver', 'admin']), bookingController.getTripManifest);

// --- Admin Routes ---
app.get('/api/v1/admin/drivers/pending', requireAuth, requireRole(['admin']), adminController.getPendingDrivers);
app.patch('/api/v1/admin/drivers/:id/verify', requireAuth, requireRole(['admin']), adminController.verifyDriver);
app.get('/api/v1/admin/analytics', requireAuth, requireRole(['admin']), adminController.getPlatformAnalytics);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Zaria-Kaduna-Kano Ride-Sharing Server Live on :${PORT}`);
  console.log(`🌐 Corridors: Zaria <-> Kaduna | Zaria <-> Kano | Kaduna <-> Kano`);
  console.log(`🔒 Meeting Point Privacy Vault & Union Accreditation Active`);
  console.log(`=======================================================`);
});

export default app;
