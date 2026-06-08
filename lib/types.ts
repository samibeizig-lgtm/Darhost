export type PropertyType = 'Villa' | 'Appartement' | 'Riad' | 'Maison' | 'Chambre';

export interface Host {
  id: string;
  name: string;
  avatar: string;
  joinDate: string;
  responseRate: number;
  responseTime: string;
  isSuperhost: boolean;
  bio: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
}

export interface HouseRule {
  title: string;
  description: string;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  location: string;
  wilaya: string;
  description: string;
  shortDescription: string;
  images: string[];
  price: number;
  cleaningFee: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  houseRules: HouseRule[];
  host: Host;
  reviews: Review[];
  categories?: string[];
  createdAt?: number;
  minNights: number;
  available: boolean;
  isDraft?: boolean;
  autoApprove?: boolean;
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
  cancellationRetention?: 25 | 50;
  lat?: number;
  lng?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'refused' | 'cancelled' | 'paid';

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  guestId: string;
  guestName: string;
  guestAvatar: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
  status: BookingStatus;
  autoApproved: boolean;
  createdAt: number;
  paymentDeadline?: number;
  respondedAt?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  hostId: string;
  guestId: string;
  hostName: string;
  hostAvatar: string;
  guestName: string;
  guestAvatar: string;
  // participantName/Avatar: kept for backwards compat, computed per viewer in UI
  propertyId?: string;
  propertyTitle?: string;
  propertyImage?: string;
  lastMessage: string;
  lastTime: string;
  lastMessageAt?: number;
  unread: number;
  messages: ChatMessage[];
  createdAt: number;
}

export type ServiceType = 'transfert' | 'voiture' | 'guide' | 'activite' | 'autre';

export interface Service {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  images: string[];
  price: number;
  priceUnit: 'trajet' | 'jour' | 'heure' | 'personne' | 'forfait';
  location: string;
  wilaya: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  rating: number;
  reviewCount: number;
  available: boolean;
  maxPersons?: number;
  languages?: string[];
  vehicleType?: string;
  includes?: string[];
  // Car rental specific
  carCategory?: 'compacte' | 'berline' | 'suv' | '4x4' | 'van' | 'luxe' | 'cabriolet' | 'autre';
  transmission?: 'manuelle' | 'automatique';
  fuelType?: 'essence' | 'diesel' | 'electrique' | 'hybride';
  doors?: number;
  withDriver?: boolean;
  mileageLimit?: string;
  insuranceIncluded?: boolean;
  deposit?: number;
  minAge?: number;
  deliveryAvailable?: boolean;
  createdAt: number;
}

export type ServiceBookingStatus = 'pending' | 'confirmed' | 'refused' | 'cancelled' | 'paid';

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceType: ServiceType;
  serviceImage: string;
  serviceLocation: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  guestId: string;
  guestName: string;
  guestAvatar: string;
  date: string;
  time?: string;
  endDate?: string;
  persons: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  flightNumber?: string;
  vehicleType?: string;
  carCategory?: string;
  withDriver?: boolean;
  language?: string;
  duration?: string;
  interests?: string;
  notes?: string;
  total: number;
  status: ServiceBookingStatus;
  createdAt: number;
}
