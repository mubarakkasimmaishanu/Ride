export interface SafeHub {
  id: string;
  name: string;
  city: 'Zaria' | 'Kaduna' | 'Kano';
  landmark_category: 'university_gate' | 'filling_station_forecourt' | 'commercial_complex';
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface Route {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface DriverInfo {
  name: string;
  avatarUrl?: string;
  rating: number;
  tripsCompleted: number;
  unionBadge: string;
  phone?: string;
}

export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  hasAirConditioning: boolean;
  photoUrl?: string;
  plateNumber?: string;
}

export interface Trip {
  id: string;
  departureTime: string;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  additionalInfo?: string;
  status: 'published' | 'full' | 'in_transit' | 'completed' | 'cancelled';
  route: Route;
  originHub: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  destinationHub: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  vehicle: VehicleInfo;
  driver: DriverInfo;
  isMeetingPointLocked: boolean;
}

export interface Booking {
  id: string;
  bookingReference?: string;
  booking_reference?: string;
  seatsBooked?: number;
  seats_booked?: number;
  totalAmount?: number;
  total_amount?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingStatus?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  departureTime?: string;
  departure_time?: string;
  originCity?: string;
  origin_city?: string;
  destinationCity?: string;
  destination_city?: string;
  originHubName?: string;
  origin_hub_name?: string;
  destinationHubName?: string;
  destination_hub_name?: string;
  isMeetingPointUnlocked?: boolean;
  exactMeetingPoint?: string;
  landmarkDirections?: string;
  driverName?: string;
  driverPhone?: string;
  driverUnionBadge?: string;
  vehiclePlateNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  boardingPin?: string;
  boarding_pin?: string;
}

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: 'passenger' | 'driver' | 'admin';
  walletBalance: number;
}
