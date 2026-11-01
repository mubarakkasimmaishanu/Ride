import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Trip, SafeHub, Booking, User } from '../types';

/**
 * Resolves the backend URL:
 * 1. EXPO_PUBLIC_API_URL if provided (see Documentation.md §3)
 * 2. Web → localhost
 * 3. Expo Go / dev build → same LAN host that serves the Metro bundle
 */
function resolveApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api/v1`;
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:5000/api/v1`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://localhost:5000/api/v1';
}

export const API_BASE = resolveApiBase();

export interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  reference: string;
  description: string;
  created_at: string;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("We couldn't reach ride servers. Check your connection and tap Retry.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || 'Something went wrong. Please try again.');
  }
  return json.data as T;
}

export const api = {
  // Auth
  async login(phoneNumber: string, password = 'password123') {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  async register(userData: any) {
    const data = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setAuthToken(data.token);
    return data;
  },

  async getProfile(): Promise<User> {
    return request<User>('/auth/profile');
  },

  async depositToWallet(amount: number) {
    return request<{ balance: number; message: string }>('/auth/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Trips
  async getSafeHubs(city?: string): Promise<SafeHub[]> {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    return request<SafeHub[]>(`/trips/safe-hubs${q}`);
  },

  async searchTrips(params: {
    originCity?: string;
    destinationCity?: string;
    date?: string;
    minSeats?: number;
    hasAC?: boolean;
    maxPrice?: number;
  }): Promise<Trip[]> {
    const query = new URLSearchParams();
    if (params.originCity) query.append('originCity', params.originCity);
    if (params.destinationCity) query.append('destinationCity', params.destinationCity);
    if (params.date) query.append('date', params.date);
    if (params.minSeats) query.append('minSeats', params.minSeats.toString());
    if (params.hasAC) query.append('hasAirConditioning', 'true');
    if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());

    return request<Trip[]>(`/trips/search?${query.toString()}`);
  },

  async getTripById(id: string): Promise<Trip> {
    return request<Trip>(`/trips/${id}`);
  },

  async createTrip(data: any) {
    return request<{ tripId: string; message: string }>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelTrip(id: string) {
    return request<{ message: string; refundedCount: number }>(`/trips/${id}/cancel`, {
      method: 'POST',
    });
  },

  async getDriverTrips(): Promise<any[]> {
    return request<any[]>('/driver/my-trips');
  },

  // Bookings
  async reserveSeats(tripId: string, seats: number) {
    return request<{
      reservationId: string;
      tripId: string;
      seats: number;
      expiresAt: string;
      totalAmount: number;
    }>('/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify({ tripId, seats }),
    });
  },

  async payWithWallet(reservationId: string) {
    return request<any>('/bookings/pay/wallet', {
      method: 'POST',
      body: JSON.stringify({ reservationId }),
    });
  },

  async payWithPaystack(reservationId: string, reference?: string) {
    return request<any>('/bookings/pay/paystack', {
      method: 'POST',
      body: JSON.stringify({ reservationId, reference }),
    });
  },

  async getBookingDetails(id: string): Promise<Booking> {
    return request<Booking>(`/bookings/${id}`);
  },

  async getMyBookings(): Promise<Booking[]> {
    return request<Booking[]>('/bookings/my-bookings');
  },

  async getTripManifest(tripId: string): Promise<any[]> {
    return request<any[]>(`/bookings/manifest/${tripId}`);
  },

  // Admin
  async getPendingDrivers(): Promise<any[]> {
    return request<any[]>('/admin/drivers/pending');
  },

  async verifyDriver(id: string, status: 'approved' | 'rejected', notes?: string) {
    return request<any>(`/admin/drivers/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async getAdminAnalytics(): Promise<any> {
    return request<any>('/admin/analytics');
  },

  async getWalletTransactions(): Promise<WalletTransaction[]> {
    return request<WalletTransaction[]>('/auth/wallet/transactions');
  },
};
