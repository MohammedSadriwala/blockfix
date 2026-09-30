import { BookingTicket, Movie } from '../types';
import { MOVIES } from '../data/mockData';

/**
 * Parses a show start date string (e.g. "2026-09-19") and time string (e.g. "10:30 AM" or "02:15 PM")
 * into a JS Date object.
 */
export const parseShowStartDateTime = (dateStr: string, timeStr: string): Date => {
  try {
    let year = 2026;
    let month = 9;
    let day = 19;

    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      }
    } else if (dateStr) {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const uppercaseDate = dateStr.toUpperCase();
      
      let foundMonth = -1;
      monthNames.forEach((m, idx) => {
        if (uppercaseDate.includes(m)) {
          foundMonth = idx;
        }
      });

      const dayMatch = dateStr.match(/\b(\d{1,2})\b/);
      const yearMatch = dateStr.match(/\b(20\d{2})\b/);

      if (foundMonth !== -1 && dayMatch) {
        month = foundMonth + 1;
        day = parseInt(dayMatch[1], 10);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
        } else {
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          year = month < currentMonth ? currentYear + 1 : currentYear;
        }
      } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

        if (ampm === 'PM' && hours < 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch (err) {
    console.error('Error parsing show start date/time:', err);
    return new Date();
  }
};

/**
 * Parses movie duration string (e.g. "2h 45m", "165 min", "2h", "135") into total duration in minutes.
 */
export const parseDurationMinutes = (durationStr?: string): number => {
  if (!durationStr) return 120; // Default 2 hours

  let totalMinutes = 0;

  const hoursMatch = durationStr.match(/(\d+)\s*h/i);
  const minsMatch = durationStr.match(/(\d+)\s*m(in)?/i);

  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }

  if (minsMatch) {
    if (!hoursMatch && durationStr.toLowerCase().includes('min')) {
      const standaloneMins = durationStr.match(/(\d+)\s*min/i);
      if (standaloneMins) {
        return parseInt(standaloneMins[1], 10);
      }
    }
    totalMinutes += parseInt(minsMatch[1], 10);
  }

  if (totalMinutes === 0 && !isNaN(Number(durationStr))) {
    totalMinutes = Number(durationStr);
  }

  return totalMinutes > 0 ? totalMinutes : 120;
};

/**
 * Dynamically calculates the show's scheduled end time using formula:
 * [Show Start Date/Time] + [Movie Duration]
 */
export const calculateShowEndTime = (
  dateStr: string,
  timeStr: string,
  durationStr?: string
): Date => {
  const startDateTime = parseShowStartDateTime(dateStr, timeStr);
  const durationMinutes = parseDurationMinutes(durationStr);
  return new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
};

/**
 * Checks if a specific showtime has expired (current system time >= calculated show end time).
 */
export const isShowtimeExpired = (
  dateStr: string,
  timeStr: string,
  durationStr?: string,
  now: Date = new Date()
): boolean => {
  const endTime = calculateShowEndTime(dateStr, timeStr, durationStr);
  return now.getTime() >= endTime.getTime();
};

/**
 * Checks if a booking's show end time has passed.
 */
export const isBookingShowEnded = (
  ticket: BookingTicket,
  now: Date = new Date()
): boolean => {
  let durationStr: string | undefined = undefined;

  if (ticket.type === 'movie') {
    const movie = MOVIES.find((m) => m.id === ticket.movieId || m.title === ticket.movieTitle);
    durationStr = movie?.duration;
  } else {
    durationStr = '3h 0m'; // Default 3 hours for live events
  }

  return isShowtimeExpired(ticket.date, ticket.time, durationStr, now);
};

/**
 * Filters active bookings: Confirmed bookings whose calculated show end time has NOT passed yet.
 */
export const getActiveBookings = (
  bookings: BookingTicket[],
  now: Date = new Date()
): BookingTicket[] => {
  return bookings.filter(
    (ticket) => ticket.status === 'Confirmed' && !isBookingShowEnded(ticket, now)
  );
};

/**
 * Filters cancelled bookings: Bookings strictly cancelled by the user.
 */
export const getCancelledBookings = (bookings: BookingTicket[]): BookingTicket[] => {
  return bookings.filter((ticket) => ticket.status === 'Cancelled');
};

/**
 * Returns all booking history (Active, naturally expired, and cancelled bookings).
 */
export const getAllBookingHistory = (bookings: BookingTicket[]): BookingTicket[] => {
  return bookings;
};
