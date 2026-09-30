import { Movie, EventItem, Theatre, Showtime, CurrencyConfig, BookingTicket } from '../types';

export interface AvailableDateItem {
  day: string;
  date: string;
  month: string;
  fullDate: string;
}

// Algorithm to generate rolling list of upcoming dates for a movie.
// If startDateStr (releaseDate) is in the future relative to today, dates start from releaseDate.
// Otherwise, dates start from today.
export const getAvailableDates = (startDateStr?: string): AvailableDateItem[] => {
  const dates: AvailableDateItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  if (startDateStr) {
    const parsedStart = new Date(startDateStr + 'T00:00:00');
    if (!isNaN(parsedStart.getTime()) && parsedStart > today) {
      start = parsedStart;
    }
  }

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const year = d.getFullYear();
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const fullDate = `${year}-${monthNum}-${dayNum}`;

    const isToday = d.toDateString() === today.toDateString();
    const dayName = isToday ? 'TODAY' : dayNames[d.getDay()];
    const dateStr = String(d.getDate());
    const monthStr = monthNames[d.getMonth()];

    dates.push({
      day: dayName,
      date: dateStr,
      month: monthStr,
      fullDate
    });
  }

  return dates;
};

export const SYSTEM_CURRENT_DATE = getAvailableDates()[0].fullDate;

// Format real-world booking timestamp e.g. "18 Sep 2026, 05:42 PM"
export const formatBookingTime = (rawDate: string): string => {
  if (!rawDate) return '';
  let dateObj = new Date(rawDate);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(rawDate.replace(' ', 'T'));
  }
  if (isNaN(dateObj.getTime())) {
    return rawDate;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `Booked on: ${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export const LOCATIONS = [
  'New York, USA',
  'Mumbai, India',
  'London, UK',
  'Tokyo, Japan',
  'Toronto, Canada',
  'Los Angeles, USA'
];

export const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  'New York, USA': {
    code: 'USD',
    symbol: '$',
    rateFromUSD: 1.0,
    paymentMethods: [
      { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
      { id: 'apple', name: 'Apple Pay', icon: '🍏' },
      { id: 'crypto', name: 'Crypto Wallet', icon: '⚡' }
    ]
  },
  'Los Angeles, USA': {
    code: 'USD',
    symbol: '$',
    rateFromUSD: 1.0,
    paymentMethods: [
      { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
      { id: 'apple', name: 'Apple Pay', icon: '🍏' },
      { id: 'crypto', name: 'Crypto Wallet', icon: '⚡' }
    ]
  },
  'Mumbai, India': {
    code: 'INR',
    symbol: '₹',
    rateFromUSD: 85.0,
    paymentMethods: [
      { id: 'upi', name: 'UPI (GPay / PhonePe / Paytm)', icon: '📱' },
      { id: 'netbanking', name: 'NetBanking', icon: '🏦' },
      { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
      { id: 'crypto', name: 'Web3 Crypto Wallet', icon: '⚡' }
    ]
  },
  'London, UK': {
    code: 'GBP',
    symbol: '£',
    rateFromUSD: 0.80,
    paymentMethods: [
      { id: 'card', name: 'Visa / Mastercard', icon: '💳' },
      { id: 'apple', name: 'Apple Pay', icon: '🍏' },
      { id: 'klarna', name: 'Klarna Pay Later', icon: '🛍️' },
      { id: 'crypto', name: 'Web3 Wallet', icon: '⚡' }
    ]
  },
  'Tokyo, Japan': {
    code: 'JPY',
    symbol: '¥',
    rateFromUSD: 150.0,
    paymentMethods: [
      { id: 'linepay', name: 'Line Pay / PayPay', icon: '📲' },
      { id: 'card', name: 'Credit Card', icon: '💳' },
      { id: 'crypto', name: 'Web3 Crypto Wallet', icon: '⚡' }
    ]
  },
  'Toronto, Canada': {
    code: 'CAD',
    symbol: 'C$',
    rateFromUSD: 1.35,
    paymentMethods: [
      { id: 'interac', name: 'Interac e-Transfer / Online', icon: '🇨🇦' },
      { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
      { id: 'crypto', name: 'Web3 Crypto Wallet', icon: '⚡' }
    ]
  }
};

export const getCurrencyForLocation = (location: string): CurrencyConfig => {
  return CURRENCY_MAP[location] || CURRENCY_MAP['New York, USA'];
};

export const formatPrice = (priceUSD: number, location: string): string => {
  const config = getCurrencyForLocation(location);
  const converted = priceUSD * config.rateFromUSD;
  if (config.code === 'JPY' || config.code === 'INR') {
    return `${config.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${config.symbol}${converted.toFixed(2)}`;
};

export const GENRES = [
  'All Genres',
  'Action',
  'Sci-Fi',
  'Adventure',
  'Drama',
  'Thriller',
  'Animation',
  'Fantasy'
];

export const LANGUAGES = [
  'All Languages',
  'English',
  'Spanish',
  'Japanese',
  'Hindi',
  'French'
];

// Distinct Theatre Seat Layouts
export const THEATRE_LAYOUTS = {
  IMAX: {
    layoutName: 'IMAX Grand Auditorium',
    rows: ['A', 'B', 'C', 'D', 'E', 'F'],
    seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    vipRows: ['E', 'F']
  },
  FOUR_DX: {
    layoutName: '4DX Motion Suite',
    rows: ['A', 'B', 'C', 'D', 'E'],
    seatNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
    vipRows: ['D', 'E']
  },
  LUXE: {
    layoutName: 'NeoVerse VIP Pavilion',
    rows: ['A', 'B', 'C', 'D'],
    seatNumbers: [1, 2, 3, 4, 5, 6],
    vipRows: ['C', 'D']
  }
};

export interface MasterTheatreConfig {
  id: string;
  name: string;
  location: string;
  city: string;
  distance: string;
  amenities: string[];
  seatLayout: typeof THEATRE_LAYOUTS.IMAX;
}

export const MASTER_THEATRES: MasterTheatreConfig[] = [
  {
    id: 'th-1',
    name: 'BlockTix Cyberplex IMAX',
    location: 'Downtown Cultural District',
    city: 'New York, USA',
    distance: '1.2 km away',
    amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner Seats', 'Gourmet Dining'],
    seatLayout: THEATRE_LAYOUTS.IMAX
  },
  {
    id: 'th-2',
    name: 'Starlight Sphere Cinema 4DX',
    location: 'Metro Center Mall, L3',
    city: 'New York, USA',
    distance: '3.4 km away',
    amenities: ['4DX Motion', '4K Laser Projection', 'VIP Lounge'],
    seatLayout: THEATRE_LAYOUTS.FOUR_DX
  },
  {
    id: 'th-3',
    name: 'NeoVerse Luxe Pavilion',
    location: 'Harbor Promenade, Bay Area',
    city: 'New York, USA',
    distance: '5.1 km away',
    amenities: ['Ultra High Definition', 'Private Suites', 'Cocktail Bar'],
    seatLayout: THEATRE_LAYOUTS.LUXE
  },
  {
    id: 'th-4',
    name: 'CineStar Grand Dolby Cinema',
    location: 'Broadway Entertainment Hub',
    city: 'New York, USA',
    distance: '2.8 km away',
    amenities: ['Dolby Cinema', 'Dual 4K Laser', 'Premium Loungers', 'Valet Parking'],
    seatLayout: THEATRE_LAYOUTS.IMAX
  },
  {
    id: 'th-5',
    name: 'Empire Regal Multiplex',
    location: '5th Avenue Center',
    city: 'New York, USA',
    distance: '4.5 km away',
    amenities: ['RealD 3D', 'Atmospheric Lighting', 'Bar & Cafe'],
    seatLayout: THEATRE_LAYOUTS.FOUR_DX
  }
];

const getSeedHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const SHOWTIME_PRESETS: { time: string; format: Showtime['format']; basePriceUSD: number }[][] = [
  [
    { time: '10:15 AM', format: 'IMAX 3D', basePriceUSD: 18.5 },
    { time: '02:30 PM', format: 'Dolby Atmos', basePriceUSD: 21.0 },
    { time: '06:45 PM', format: 'IMAX 3D', basePriceUSD: 24.0 },
    { time: '10:15 PM', format: '2D Standard', basePriceUSD: 19.5 }
  ],
  [
    { time: '11:45 AM', format: '4DX', basePriceUSD: 20.0 },
    { time: '03:30 PM', format: '3D VIP', basePriceUSD: 25.0 },
    { time: '07:15 PM', format: 'Dolby Atmos', basePriceUSD: 23.5 }
  ],
  [
    { time: '09:30 AM', format: '2D Standard', basePriceUSD: 16.0 },
    { time: '01:15 PM', format: 'IMAX 3D', basePriceUSD: 20.5 },
    { time: '05:00 PM', format: '4DX', basePriceUSD: 22.0 },
    { time: '08:45 PM', format: '3D VIP', basePriceUSD: 26.0 }
  ],
  [
    { time: '12:30 PM', format: 'Dolby Atmos', basePriceUSD: 21.5 },
    { time: '04:45 PM', format: 'IMAX 3D', basePriceUSD: 23.0 },
    { time: '09:00 PM', format: '4DX', basePriceUSD: 24.5 }
  ],
  [
    { time: '10:45 AM', format: '3D VIP', basePriceUSD: 22.0 },
    { time: '02:15 PM', format: '2D Standard', basePriceUSD: 17.5 },
    { time: '06:00 PM', format: 'Dolby Atmos', basePriceUSD: 22.5 },
    { time: '09:30 PM', format: 'IMAX 3D', basePriceUSD: 25.0 }
  ]
];

export const generateTheatresForMovie = (movieId: string, releaseDate?: string): Theatre[] => {
  const dates = getAvailableDates(releaseDate);
  const dateStrings = dates.map((d) => d.fullDate);

  const theatreMap: Record<string, { theatre: MasterTheatreConfig; availableDates: string[]; dateSchedules: Record<string, Showtime[]> }> = {};

  MASTER_THEATRES.forEach((masterTh) => {
    theatreMap[masterTh.id] = {
      theatre: masterTh,
      availableDates: [],
      dateSchedules: {}
    };
  });

  dateStrings.forEach((dStr, dIdx) => {
    MASTER_THEATRES.forEach((masterTh, thIdx) => {
      const combHash = getSeedHash(`${movieId}_${dStr}_${masterTh.id}`);
      // Deterministically select 2-4 theatres per date per movie
      const isIncluded = (combHash + dIdx + thIdx) % 5 !== 0;

      if (isIncluded) {
        const presetIdx = (combHash + dIdx) % SHOWTIME_PRESETS.length;
        const presetShowtimes = SHOWTIME_PRESETS[presetIdx];

        const showtimes: Showtime[] = presetShowtimes.map((st, stIdx) => {
          const stHash = getSeedHash(`${movieId}_${dStr}_${masterTh.id}_${stIdx}`);
          const availableSeats = (stHash % 40) + 10;
          return {
            id: `st-${masterTh.id}-${dStr}-${stIdx}`,
            time: st.time,
            format: st.format,
            basePriceUSD: st.basePriceUSD,
            availableSeats: availableSeats,
            totalSeats: 60
          };
        });

        theatreMap[masterTh.id].availableDates.push(dStr);
        theatreMap[masterTh.id].dateSchedules[dStr] = showtimes;
      }
    });
  });

  return MASTER_THEATRES.map((masterTh) => {
    const data = theatreMap[masterTh.id];
    return {
      ...masterTh,
      availableDates: data.availableDates,
      dateSchedules: data.dateSchedules
    };
  }).filter((th) => th.availableDates.length > 0);
};

export const SAMPLE_THEATRES: Theatre[] = generateTheatresForMovie('mv-1', '2026-05-12');

// Helper to calculate dynamic occupied seats per (movieId + date + theatreId + showtimeId)
export const getOccupiedSeatsForCombination = (
  movieId: string,
  date: string,
  theatreId: string,
  showtimeId: string,
  layout: typeof THEATRE_LAYOUTS.IMAX,
  myBookings: BookingTicket[] = []
): string[] => {
  // Deterministic base hash for initial dummy occupancy per (movieId + date + theatreId + showtimeId)
  const hashString = `${movieId}-${date}-${theatreId}-${showtimeId}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }

  const occupiedSet = new Set<string>();
  const rows = layout.rows;
  const numbers = layout.seatNumbers;

  rows.forEach((r, rIdx) => {
    numbers.forEach((n, nIdx) => {
      const val = Math.abs((hash * (rIdx + 1) * 31 + (nIdx + 1) * 17) % 100);
      if (val < 20) {
        occupiedSet.add(`${r}${n}`);
      }
    });
  });

  const targetMovie = MOVIES.find((m) => m.id === movieId);
  const targetTheatre = targetMovie?.theatres.find((t) => t.id === theatreId);

  // Add seats from active confirmed user bookings for exact (Movie + Date + Theatre + Showtime)
  myBookings
    .filter((b) => b.status === 'Confirmed' && b.type === 'movie')
    .forEach((b) => {
      const isMatchingMovie = b.movieId ? b.movieId === movieId : (targetMovie ? b.movieTitle === targetMovie.title : true);
      const isMatchingDate = b.date === date;
      const isMatchingTheatre = b.theatreId ? b.theatreId === theatreId : (targetTheatre ? (b.theatreName === targetTheatre.name || b.theatreName.includes(targetTheatre.name)) : true);

      // Check showtime matching: if b.showtimeId exists, compare directly, or match b.time with target showtime
      let isMatchingShowtime = true;
      if (b.showtimeId) {
        isMatchingShowtime = b.showtimeId === showtimeId;
      } else if (targetTheatre && targetTheatre.dateSchedules[date]) {
        const targetShowtime = targetTheatre.dateSchedules[date].find((st) => st.id === showtimeId);
        if (targetShowtime) {
          isMatchingShowtime = b.time === targetShowtime.time;
        }
      }

      if (isMatchingMovie && isMatchingDate && isMatchingTheatre && isMatchingShowtime) {
        b.seats.forEach((seat) => occupiedSet.add(seat));
      }
    });

  // Remove seats from cancelled user bookings so they become available again
  myBookings
    .filter((b) => b.status === 'Cancelled' && b.type === 'movie')
    .forEach((b) => {
      const isMatchingMovie = b.movieId ? b.movieId === movieId : (targetMovie ? b.movieTitle === targetMovie.title : true);
      const isMatchingDate = b.date === date;
      const isMatchingTheatre = b.theatreId ? b.theatreId === theatreId : (targetTheatre ? (b.theatreName === targetTheatre.name || b.theatreName.includes(targetTheatre.name)) : true);

      let isMatchingShowtime = true;
      if (b.showtimeId) {
        isMatchingShowtime = b.showtimeId === showtimeId;
      } else if (targetTheatre && targetTheatre.dateSchedules[date]) {
        const targetShowtime = targetTheatre.dateSchedules[date].find((st) => st.id === showtimeId);
        if (targetShowtime) {
          isMatchingShowtime = b.time === targetShowtime.time;
        }
      }

      if (isMatchingMovie && isMatchingDate && isMatchingTheatre && isMatchingShowtime) {
        b.seats.forEach((seat) => occupiedSet.delete(seat));
      }
    });

  return Array.from(occupiedSet);
};


export const MOVIES: Movie[] = [
  {
    id: 'mv-1',
    title: 'Cyber Odyssey 2099',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1600&auto=format&fit=crop',
    rating: 4.9,
    voteCount: '124.5k votes',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    language: ['English', 'Japanese'],
    duration: '2h 45m',
    releaseDate: '2026-05-12',
    status: 'now_showing',
    description: 'In a sprawling futuristic metropolis where memories are traded like currency, a rogue detective uncovers a global conspiracy threatening to rewrite human consciousness.',
    director: 'Elena Rostova',
    ageRating: 'PG-13',
    trendingRank: 1,
    cast: [
      { id: 'c1', name: 'Marcus Vance', character: 'Det. Kai Sterling', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' },
      { id: 'c2', name: 'Aria Chen', character: 'Nomi Vane', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop' },
      { id: 'c3', name: 'Devon Kross', character: 'Archon Malakor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
      { id: 'c4', name: 'Sophia Ray', character: 'Dr. Lyra Mercer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-1', '2026-05-12')
  },
  {
    id: 'mv-2',
    title: 'Shadows of the Pantheon',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1600&auto=format&fit=crop',
    rating: 4.7,
    voteCount: '98.2k votes',
    genre: ['Fantasy', 'Action', 'Drama'],
    language: ['English', 'Spanish'],
    duration: '2h 20m',
    releaseDate: '2026-04-28',
    status: 'now_showing',
    description: 'When ancient mythic titans awake beneath modern civilization, a group of unlikely guardians must unite forgotten relics to prevent eternal chaos.',
    director: 'Guillermo Torres',
    ageRating: 'PG-13',
    trendingRank: 2,
    cast: [
      { id: 'c5', name: 'Mateo Morales', character: 'Kaelen Thorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' },
      { id: 'c6', name: 'Isabella Silva', character: 'High Priestess Lyanna', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop' },
      { id: 'c7', name: 'Jonah Vance', character: 'General Vael', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-2', '2026-04-28')
  },
  {
    id: 'mv-3',
    title: 'Starlight Symphony',
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop',
    rating: 4.8,
    voteCount: '65.4k votes',
    genre: ['Drama', 'Animation'],
    language: ['Japanese', 'English'],
    duration: '1h 55m',
    releaseDate: '2026-05-04',
    status: 'now_showing',
    description: 'A prodigy pianist discovers a portal to a realm powered by celestial melodies, leading to a breathtaking quest to restore harmony to two dying worlds.',
    director: 'Kenji Takahashi',
    ageRating: 'PG',
    trendingRank: 3,
    cast: [
      { id: 'c8', name: 'Rin Hoshino', character: 'Aoi Sora', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' },
      { id: 'c9', name: 'Liam O\'Connor', character: 'Maestro William', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-3', '2026-05-04')
  },
  {
    id: 'mv-4',
    title: 'Velocity Apex',
    poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600&auto=format&fit=crop',
    rating: 4.6,
    voteCount: '83.1k votes',
    genre: ['Action', 'Thriller'],
    language: ['English', 'French'],
    duration: '2h 10m',
    releaseDate: '2026-04-15',
    status: 'now_showing',
    description: 'Underground electric hypercar racers risk everything in a high-stakes championship across Tokyo, Paris, and Monte Carlo to win total freedom.',
    director: 'Antoine Laurent',
    ageRating: 'PG-13',
    cast: [
      { id: 'c10', name: 'Damian Cross', character: 'Ren "Ghost" Tanaka', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop' },
      { id: 'c11', name: 'Camille Dubois', character: 'Chloe Laurent', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-4', '2026-04-15')
  },
  {
    id: 'mv-5',
    title: 'Echoes of Chronos',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
    rating: 4.9,
    voteCount: 'Coming Soon',
    genre: ['Sci-Fi', 'Thriller'],
    language: ['English'],
    duration: '2h 30m',
    releaseDate: '2026-10-24',
    status: 'upcoming',
    description: 'When quantum physicists build a bridge to yesterday, they accidentally summon an anomaly that erases future timelines one day at a time.',
    director: 'Christopher Nolan Style',
    ageRating: 'PG-13',
    cast: [
      { id: 'c12', name: 'Ethan Hawke Jr.', character: 'Dr. Seth Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
      { id: 'c13', name: 'Zendaya Cole', character: 'Aria Cross', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-5', '2026-10-24')
  },
  {
    id: 'mv-6',
    title: 'Realm of Dragons: Genesis',
    poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
    rating: 4.8,
    voteCount: 'Coming Soon',
    genre: ['Fantasy', 'Adventure'],
    language: ['English', 'Hindi'],
    duration: '2h 50m',
    releaseDate: '2026-11-15',
    status: 'upcoming',
    description: 'The untold origin story of the dragon riders who united five warring kingdoms under a single golden banner thousands of years ago.',
    director: 'Peter Jackson Vibe',
    ageRating: 'PG-13',
    cast: [
      { id: 'c14', name: 'Tarek Al-Mansoor', character: 'Prince Eldrin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-6', '2026-11-15')
  },
  {
    id: 'mv-7',
    title: 'Neon Noir: Red Velvet',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    rating: 4.5,
    voteCount: 'Coming Soon',
    genre: ['Thriller', 'Drama'],
    language: ['English', 'French'],
    duration: '2h 05m',
    releaseDate: '2026-12-10',
    status: 'upcoming',
    description: 'In rainy neon-soaked Paris, a jazz saxophonist gets caught in a dangerous cat-and-mouse game with an elusive art thief.',
    director: 'Claire Denis',
    ageRating: 'R',
    cast: [
      { id: 'c15', name: 'Sebastian Thorne', character: 'Lucian Noir', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop' }
    ],
    theatres: generateTheatresForMovie('mv-7', '2026-12-10')
  }
];

export const EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: 'CyberSound Music Festival 2026',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    category: 'Music Concert',
    date: 'SAT, OCT 24',
    time: '06:00 PM onwards',
    venue: 'BlockTix Arena Stadium',
    city: 'New York, USA',
    basePriceUSD: 75.0,
    rating: 4.9,
    tag: 'Selling Fast',
    description: 'World top synthwave, EDM, and cyberpunk live music acts under futuristic 360-degree holographic laser projections.',
    ticketTiers: [
      { id: 'tier-gen', name: 'General', priceMultiplier: 1.0, description: 'Standard General Admission Standing Deck Access' },
      { id: 'tier-prem', name: 'Premium', priceMultiplier: 1.5, description: 'Priority Front Row Zone + Commemorative Lanyard' },
      { id: 'tier-vip', name: 'VIP', priceMultiplier: 2.5, description: 'VIP Lounge Lounge Access + Open Bar + Express Gate' }
    ]
  },
  {
    id: 'ev-2',
    title: 'Global Tech & AI Summit 2026',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
    category: 'Conference',
    date: 'FRI, NOV 13',
    time: '09:00 AM - 05:00 PM',
    venue: 'Metropolitan Convention Hub',
    city: 'New York, USA',
    basePriceUSD: 120.0,
    rating: 4.8,
    tag: 'Trending',
    description: 'Keynotes from world-leading AI pioneers, Web3 visionaries, and futuristic product demos.',
    ticketTiers: [
      { id: 'tier-gen', name: 'General', priceMultiplier: 1.0, description: 'Main Auditorium Keynote Access' },
      { id: 'tier-prem', name: 'Premium', priceMultiplier: 1.4, description: 'Keynote + Workshop Sessions & Networking Lunch' },
      { id: 'tier-vip', name: 'VIP', priceMultiplier: 2.2, description: 'Executive All-Access Pass + Speaker Dinner Invitation' }
    ]
  },
  {
    id: 'ev-3',
    title: 'Apex Esports World Championship',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    category: 'Gaming',
    date: 'SAT, NOV 28',
    time: '02:00 PM',
    venue: 'Apex Coliseum',
    city: 'Los Angeles, USA',
    basePriceUSD: 45.0,
    rating: 4.9,
    tag: 'VIP Available',
    description: 'Top 16 global esports teams battle live on the gigantic stage for $10M grand prize pool.',
    ticketTiers: [
      { id: 'tier-gen', name: 'General', priceMultiplier: 1.0, description: 'Arena Seating Access' },
      { id: 'tier-prem', name: 'Premium', priceMultiplier: 1.6, description: 'Lower Ring Seats + Exclusive In-Game Skin Bundle' },
      { id: 'tier-vip', name: 'VIP', priceMultiplier: 2.5, description: 'Player Lounge Access + Meet & Greet + Swag Bag' }
    ]
  },
  {
    id: 'ev-4',
    title: 'Laugh Out Loud Live with Ronny Chieng',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=800&auto=format&fit=crop',
    category: 'Comedy',
    date: 'SUN, DEC 06',
    time: '08:00 PM',
    venue: 'The Laugh Factory Grand',
    city: 'New York, USA',
    basePriceUSD: 35.0,
    rating: 4.7,
    description: 'An unforgettable evening of sharp political satire and hilarious stand-up comedy.',
    ticketTiers: [
      { id: 'tier-gen', name: 'General', priceMultiplier: 1.0, description: 'Standard Balcony Seating' },
      { id: 'tier-prem', name: 'Premium', priceMultiplier: 1.5, description: 'Main Floor Seats' },
      { id: 'tier-vip', name: 'VIP', priceMultiplier: 2.2, description: 'Front 3 Rows + Meet & Greet Photo' }
    ]
  }
];

export const AVAILABLE_DATES = getAvailableDates();

const initialDates = getAvailableDates();

export const INITIAL_BOOKINGS: BookingTicket[] = [
  {
    id: 'TK-894201',
    type: 'movie',
    movieId: 'mv-1',
    theatreId: 'th-1',
    showtimeId: `st-103-${initialDates[0]?.fullDate}`,
    movieTitle: 'Cyber Odyssey 2099',
    moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    date: initialDates[0]?.fullDate || '2026-09-18',
    time: '06:00 PM',
    theatreName: 'BlockTix Cyberplex IMAX',
    seats: ['E7', 'E8'],
    totalPrice: 47.50,
    currencySymbol: '$',
    currencyCode: 'USD',
    bookingCode: 'BTX-9942-NY',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BTX-9942-NY',
    status: 'Confirmed',
    bookedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    paymentType: 'standard',
    paymentMethodName: 'Credit / Debit Card'
  },
  {
    id: 'TK-331042',
    type: 'event',
    movieTitle: 'CyberSound Music Festival 2026',
    moviePoster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    date: 'SAT, OCT 24',
    time: '06:00 PM',
    theatreName: 'BlockTix Arena Stadium',
    seats: ['VIP Pass x 2'],
    totalPrice: 375.00,
    currencySymbol: '$',
    currencyCode: 'USD',
    bookingCode: 'BTX-EV-7721',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BTX-EV-7721',
    status: 'Confirmed',
    bookedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    ticketTierName: 'VIP',
    quantity: 2,
    paymentType: 'standard',
    paymentMethodName: 'Credit / Debit Card'
  }
];
