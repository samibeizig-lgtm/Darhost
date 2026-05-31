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
  lat?: number;
  lng?: number;
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
  participantName: string;
  participantAvatar: string;
  propertyTitle?: string;
  propertyImage?: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: ChatMessage[];
}
