export type PageType = 'home' | 'movies' | 'movie-details' | 'events' | 'my-bookings';

export interface CastMember {
  id: string;
  name: string;
  character: string;
  avatar: string;
}

export interface Showtime {
  id: string;
  time: string;
  format: 'IMAX 3D' | 'Dolby Atmos' | '4DX' | '2D Standard' | '3D VIP';
  basePriceUSD: number;
  availableSeats: number;
  totalSeats: number;
}

export interface SeatLayoutConfig {
  layoutName: string;
  rows: string[];
  seatNumbers: number[];
  vipRows: string[];
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  city: string;
  distance: string;
  amenities: string[];
  seatLayout: SeatLayoutConfig;
  // Map of fullDate (e.g. "2026-09-16") to showtimes available on that date
  availableDates: string[];
  dateSchedules: Record<string, Showtime[]>;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  rating: number;
  voteCount: string;
  genre: string[];
  language: string[];
  duration: string;
  releaseDate: string; // ISO date string e.g. "2026-05-12"
  status: 'now_showing' | 'upcoming';
  description: string;
  director: string;
  ageRating: string;
  cast: CastMember[];
  theatres: Theatre[];
  trendingRank?: number;
}

export interface TicketTier {
  id: string;
  name: 'General' | 'Premium' | 'VIP';
  priceMultiplier: number;
  description: string;
}

export interface EventItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  basePriceUSD: number;
  rating: number;
  tag?: string;
  description: string;
  ticketTiers: TicketTier[];
}

export interface BookingState {
  movieId: string;
  selectedDate: string; // ISO date string e.g. "2026-09-16"
  selectedTheatreId: string | null;
  selectedShowtimeId: string | null;
  selectedSeats: string[];
  seatPriceUSD: number;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number;
  nftsCount: number;
  chainId?: number | null;
  networkError?: string | null;
}

export interface FilterOptions {
  genre: string;
  language: string;
  location: string;
  searchQuery: string;
  sortBy: 'popularity' | 'rating' | 'newest';
}

export interface BookingTicket {
  id: string;
  type: 'movie' | 'event';
  movieId?: string;
  theatreId?: string;
  showtimeId?: string;
  movieTitle: string;
  moviePoster: string;
  date: string;
  time: string;
  theatreName: string;
  seats: string[];
  totalPrice: number;
  currencySymbol: string;
  currencyCode: string;
  bookingCode: string;
  qrCodeUrl: string;
  status: 'Confirmed' | 'Cancelled';
  bookedAt: string;
  ticketTierName?: string;
  quantity?: number;
  txHash?: string;
  refundTxHash?: string;
  payerAddress?: string;
  paymentType?: 'blockchain' | 'standard';
  paymentMethodName?: string;
}

export const isBlockchainBooking = (ticket: BookingTicket): boolean => {
  if (ticket.paymentType === 'blockchain') return true;
  if (ticket.paymentType === 'standard') return false;
  return Boolean(ticket.txHash && ticket.txHash.trim().length > 0);
};

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rateFromUSD: number;
  paymentMethods: { id: string; name: string; icon: string }[];
}
