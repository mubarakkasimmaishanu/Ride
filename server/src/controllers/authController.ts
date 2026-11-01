import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, runTransaction } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_zaria_kaduna_kano_ride_jwt_key_2026';

export function register(req: Request, res: Response) {
  const {
    fullName,
    phoneNumber,
    email,
    password,
    role = 'passenger',
    // Driver-specific fields
    driverType,
    licenseNumber,
    nin,
    unionName,
    unionBranchCity,
    unionMembershipNumber,
    unionSlipPhotoUrl,
    // Vehicle-specific fields
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    plateNumber,
    passengerCapacity,
    hasAirConditioning,
  } = req.body;

  if (!fullName || !phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Full name, phone number, and password are required' }
    });
  }

  const db = getDatabase();

  // Check if phone number already registered
  const existing = (db.prepare('SELECT id FROM users WHERE phone_number = ?').get as any)(phoneNumber);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'PHONE_EXISTS', message: 'A user with this phone number already exists' }
    });
  }

  try {
    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    runTransaction(() => {
      // 1. Create User
      (db.prepare(`
        INSERT INTO users (id, full_name, phone_number, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run as any)(userId, fullName, phoneNumber, email || null, passwordHash, role);

      // 2. Initialize In-App Wallet for all users
      const walletId = uuidv4();
      (db.prepare(`
        INSERT INTO wallets (id, user_id, balance, currency)
        VALUES (?, ?, 0.0, 'NGN')
      `).run as any)(walletId, userId);

      // 3. If driver, create driver record and vehicle
      if (role === 'driver') {
        if (!licenseNumber || !nin || !unionName || !unionBranchCity || !unionMembershipNumber) {
          throw new Error('Driver registration requires license, NIN, and union accreditation details');
        }

        const driverId = uuidv4();
        (db.prepare(`
          INSERT INTO drivers (
            id, user_id, driver_type, license_number, nin,
            union_name, union_branch_city, union_membership_number, union_slip_photo_url,
            verification_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).run as any)(
          driverId,
          userId,
          driverType || 'private_owner',
          licenseNumber,
          nin,
          unionName,
          unionBranchCity,
          unionMembershipNumber,
          unionSlipPhotoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957'
        );

        if (plateNumber) {
          const vehicleId = uuidv4();
          (db.prepare(`
            INSERT INTO vehicles (
              id, driver_id, make, model, year, color, plate_number, passenger_capacity, has_air_conditioning
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run as any)(
            vehicleId,
            driverId,
            vehicleMake || 'Toyota',
            vehicleModel || 'Corolla',
            vehicleYear ? parseInt(vehicleYear) : 2012,
            vehicleColor || 'Silver',
            plateNumber,
            passengerCapacity ? parseInt(passengerCapacity) : 4,
            hasAirConditioning ? 1 : 0
          );
        }
      }
    });

    const token = jwt.sign({ id: userId, role, phone: phoneNumber, name: fullName }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: userId, fullName, phoneNumber, email, role }
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: err.message }
    });
  }
}

export function login(req: Request, res: Response) {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Phone number and password are required' }
    });
  }

  const db = getDatabase();
  const user = (db.prepare(`
    SELECT u.id, u.full_name, u.phone_number, u.email, u.password_hash, u.role, u.is_active,
           w.balance as wallet_balance
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.phone_number = ?
  `).get as any)(phoneNumber) as any;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone number or password' }
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone number or password' }
    });
  }

  // Get driver details if driver
  let driverInfo = null;
  if (user.role === 'driver') {
    driverInfo = (db.prepare(`
      SELECT d.id as driver_id, d.union_name, d.union_branch_city, d.union_membership_number,
             d.verification_status, d.total_trips_completed, d.average_rating,
             v.id as vehicle_id, v.make, v.model, v.color, v.plate_number
      FROM drivers d
      LEFT JOIN vehicles v ON d.id = v.driver_id
      WHERE d.user_id = ?
    `).get as any)(user.id);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, phone: user.phone_number, name: user.full_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        email: user.email,
        role: user.role,
        walletBalance: user.wallet_balance || 0,
        driver: driverInfo
      }
    }
  });
}

export function getProfile(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const db = getDatabase();

  const user = (db.prepare(`
    SELECT u.id, u.full_name, u.phone_number, u.email, u.role, u.created_at,
           w.balance as wallet_balance
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.id = ?
  `).get as any)(userId) as any;

  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }

  let driver = null;
  if (user.role === 'driver') {
    driver = (db.prepare(`
      SELECT d.*, v.make, v.model, v.color, v.plate_number, v.passenger_capacity, v.has_air_conditioning
      FROM drivers d
      LEFT JOIN vehicles v ON d.id = v.driver_id
      WHERE d.user_id = ?
    `).get as any)(userId);
  }

  return res.json({
    success: true,
    data: {
      ...user,
      walletBalance: user.wallet_balance || 0,
      driver
    }
  });
}

export function getWalletTransactions(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const db = getDatabase();

  const transactions = (db.prepare(`
    SELECT wt.id, wt.transaction_type, wt.amount, wt.reference, wt.description, wt.created_at
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    WHERE w.user_id = ?
    ORDER BY wt.created_at DESC
    LIMIT 50
  `).all as any)(userId);

  return res.json({ success: true, data: transactions });
}

export function depositToWallet(req: AuthRequest, res: Response) {
  const userId = req.user?.id as string;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: { message: 'Valid deposit amount required' } });
  }

  const db = getDatabase();
  const wallet = (db.prepare('SELECT id, balance FROM wallets WHERE user_id = ?').get as any)(userId) as any;

  if (!wallet) {
    return res.status(404).json({ success: false, error: { message: 'Wallet not found' } });
  }

  runTransaction(() => {
    (db.prepare('UPDATE wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run as any)(
      amount,
      wallet.id
    );

    (db.prepare(`
      INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount, reference, description)
      VALUES (?, ?, 'credit_deposit', ?, ?, 'Manual test wallet funding')
    `).run as any)(uuidv4(), wallet.id, amount, 'DEP-' + Date.now());
  });

  const updatedWallet = (db.prepare('SELECT balance FROM wallets WHERE id = ?').get as any)(wallet.id) as any;

  return res.json({
    success: true,
    data: {
      balance: updatedWallet.balance,
      message: `₦${amount.toLocaleString()} successfully credited to your wallet`
    }
  });
}
