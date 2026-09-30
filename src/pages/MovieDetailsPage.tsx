import React, { useState, useEffect } from 'react';
import { 
  Star, Clock, Globe, Shield, Ticket, ArrowLeft, 
  MapPin, Check, Info, Sparkles, AlertCircle 
} from 'lucide-react';
import { Movie, BookingState, PageType, BookingTicket } from '../types';
import { getAvailableDates, formatPrice, getOccupiedSeatsForCombination } from '../data/mockData';
import { isShowtimeExpired } from '../utils/bookingTimeUtils';

interface MovieDetailsPageProps {
  movie: Movie;
  bookingState: BookingState;
  onUpdateBookingState: (partial: Partial<BookingState>) => void;
  onNavigate: (page: PageType) => void;
  onOpenPaymentModal: () => void;
  selectedLocation: string;
  myBookings?: BookingTicket[];
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  bookingState,
  onUpdateBookingState,
  onNavigate,
  onOpenPaymentModal,
  selectedLocation,
  myBookings = []
}) => {
  const [activeTab, setActiveTab] = useState<'booking' | 'synopsis' | 'cast'>('booking');

  const availableDatesList = getAvailableDates(movie.releaseDate);

  // Requirement #1: Filter theatres available for selected date
  const selectedDate = bookingState.selectedDate || availableDatesList[0].fullDate;
  const availableTheatresForDate = movie.theatres.filter(
    (th) => th.availableDates.includes(selectedDate) && (th.dateSchedules[selectedDate]?.length ?? 0) > 0
  );

  // If selected theatre is not available for this date, pick first available theatre for this date
  const currentTheatre = availableTheatresForDate.find((t) => t.id === bookingState.selectedTheatreId) || availableTheatresForDate[0] || movie.theatres[0];

  // Available showtimes for current date & theatre
  const availableShowtimes = currentTheatre?.dateSchedules[selectedDate] || [];
  const currentShowtime = availableShowtimes.find((st) => st.id === bookingState.selectedShowtimeId) || availableShowtimes[0];

  // Requirement #2: Dynamic occupied seats for combination (Movie + Date + Theatre + Showtime)
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  useEffect(() => {
    if (currentTheatre && currentShowtime) {
      const occupied = getOccupiedSeatsForCombination(
        movie.id,
        selectedDate,
        currentTheatre.id,
        currentShowtime.id,
        currentTheatre.seatLayout,
        myBookings
      );
      setOccupiedSeats(occupied);
    }
  }, [movie.id, selectedDate, currentTheatre?.id, currentShowtime?.id, myBookings]);

  // Handle Date Change
  const handleSelectDate = (dateStr: string) => {
    const theatresForNewDate = movie.theatres.filter(
      (th) => th.availableDates.includes(dateStr) && (th.dateSchedules[dateStr]?.length ?? 0) > 0
    );
    const chosenTheatre = theatresForNewDate.find((t) => t.id === bookingState.selectedTheatreId) || theatresForNewDate[0] || movie.theatres[0];
    const newShowtimes = chosenTheatre?.dateSchedules[dateStr] || [];
    const newShowtime = newShowtimes[0];

    onUpdateBookingState({
      selectedDate: dateStr,
      selectedTheatreId: chosenTheatre?.id || null,
      selectedShowtimeId: newShowtime?.id || null,
      selectedSeats: [], // Reset seats on date change
      seatPriceUSD: newShowtime?.basePriceUSD || 20.0
    });
  };

  // Handle Theatre Change
  const handleSelectTheatre = (theatreId: string) => {
    const chosenTheatre = movie.theatres.find((t) => t.id === theatreId) || movie.theatres[0];
    const newShowtimes = chosenTheatre.dateSchedules[selectedDate] || [];
    const newShowtime = newShowtimes[0];

    onUpdateBookingState({
      selectedTheatreId: chosenTheatre.id,
      selectedShowtimeId: newShowtime?.id || null,
      selectedSeats: [], // Reset seats on theatre change
      seatPriceUSD: newShowtime?.basePriceUSD || 20.0
    });
  };

  // Handle Showtime Change
  const handleSelectShowtime = (showtimeId: string) => {
    const chosenST = availableShowtimes.find((st) => st.id === showtimeId) || availableShowtimes[0];
    onUpdateBookingState({
      selectedShowtimeId: showtimeId,
      selectedSeats: [], // Reset seats on showtime change
      seatPriceUSD: chosenST?.basePriceUSD || 20.0
    });
  };

  // Handle Seat Selection
  const toggleSeat = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return; // Occupied seat cannot be selected

    const currentSeats = [...bookingState.selectedSeats];
    const seatIndex = currentSeats.indexOf(seatId);

    if (seatIndex > -1) {
      currentSeats.splice(seatIndex, 1);
    } else {
      if (currentSeats.length >= 8) {
        alert('Maximum 8 seats per booking transaction.');
        return;
      }
      currentSeats.push(seatId);
    }

    onUpdateBookingState({ selectedSeats: currentSeats });
  };

  const totalPriceUSD = (currentShowtime?.basePriceUSD || 20.0) * bookingState.selectedSeats.length;

  return (
    <div className="space-y-8 pb-32">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('movies')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-[#F84464]" />
        <span>Back to Movies</span>
      </button>

      {/* Hero Backdrop & Details Header */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 bg-[#1F2533] shadow-lg text-white">
        <div className="absolute inset-0 aspect-[21/9] w-full">
          <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover opacity-25 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2533] via-[#1F2533]/80 to-transparent" />
        </div>

        <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex-shrink-0">
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
          </div>

          {/* Metadata */}
          <div className="flex-grow space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#F84464] text-white text-xs font-extrabold rounded-md uppercase tracking-wider">
                {movie.ageRating}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{movie.rating} / 5 ({movie.voteCount})</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F84464]" /> {movie.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-gray-300" /> {movie.language.join(', ')}
              </span>
              <span className="text-gray-300">Director: <strong className="text-white">{movie.director}</strong></span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {movie.genre.map((g) => (
                <span key={g} className="px-3 py-1 bg-white/10 border border-white/20 text-gray-200 text-xs font-semibold rounded-lg">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
              {movie.description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('booking')}
          className={`flex-1 sm:flex-none px-6 py-3 font-extrabold text-xs sm:text-sm tracking-wider uppercase border-b-2 transition-all rounded-xl ${
            activeTab === 'booking'
              ? 'border-[#F84464] text-[#F84464] bg-red-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Book Tickets
        </button>
        <button
          onClick={() => setActiveTab('synopsis')}
          className={`flex-1 sm:flex-none px-6 py-3 font-extrabold text-xs sm:text-sm tracking-wider uppercase border-b-2 transition-all rounded-xl ${
            activeTab === 'synopsis'
              ? 'border-[#F84464] text-[#F84464] bg-red-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Synopsis & Story
        </button>
        <button
          onClick={() => setActiveTab('cast')}
          className={`flex-1 sm:flex-none px-6 py-3 font-extrabold text-xs sm:text-sm tracking-wider uppercase border-b-2 transition-all rounded-xl ${
            activeTab === 'cast'
              ? 'border-[#F84464] text-[#F84464] bg-red-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Cast & Crew
        </button>
      </div>

      {/* TAB CONTENT: 3-STEP BOOKING ENGINE */}
      {activeTab === 'booking' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* STEP 1: SELECT DATE */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1A1D24] uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F84464] text-white flex items-center justify-center text-xs font-black">1</span>
                <span>Select Date</span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">Available show dates</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {availableDatesList.map((item) => {
                const isSelected = selectedDate === item.fullDate;
                return (
                  <button
                    key={item.fullDate}
                    onClick={() => handleSelectDate(item.fullDate)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-[#F84464] border-[#F84464] text-white shadow-sm scale-105 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{item.day}</span>
                    <span className="text-xl font-black">{item.date}</span>
                    <span className="text-[10px] font-semibold opacity-80">{item.month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: SELECT THEATRE & SHOWTIME */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1A1D24] uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F84464] text-white flex items-center justify-center text-xs font-black">2</span>
                <span>Select Theatre & Showtime</span>
              </h3>
              <span className="text-xs text-gray-500 font-medium">{availableTheatresForDate.length} Theatres Available</span>
            </div>

            {availableTheatresForDate.length === 0 ? (
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center text-gray-500 text-xs">
                No theatres available for the selected date. Please pick another date.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableTheatresForDate.map((th) => {
                  const isSelectedTheatre = currentTheatre?.id === th.id;
                  const showtimesForThisDate = th.dateSchedules[selectedDate] || [];

                  return (
                    <div
                      key={th.id}
                      onClick={() => handleSelectTheatre(th.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelectedTheatre
                          ? 'bg-red-50/40 border-[#F84464] shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-[#1A1D24]">{th.name}</h4>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                              {th.distance}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{th.location}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {th.amenities.map((am) => (
                              <span key={am} className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Showtimes for this Theatre & Date */}
                        <div className="flex flex-wrap gap-2.5 items-center">
                          {showtimesForThisDate.map((st) => {
                            const isSelectedST = isSelectedTheatre && currentShowtime?.id === st.id;
                            const priceFormatted = formatPrice(st.basePriceUSD, selectedLocation);
                            const isExpired = isShowtimeExpired(selectedDate, st.time, movie.duration);

                            return (
                              <button
                                key={st.id}
                                disabled={isExpired}
                                onClick={(e) => {
                                  if (isExpired) return;
                                  e.stopPropagation();
                                  handleSelectTheatre(th.id);
                                  handleSelectShowtime(st.id);
                                }}
                                className={`px-4 py-2.5 rounded-xl border flex flex-col items-center transition-all ${
                                  isExpired
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                    : isSelectedST
                                    ? 'bg-[#F84464] border-[#F84464] text-white font-black shadow-sm scale-105'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#F84464] hover:text-[#F84464]'
                                }`}
                              >
                                <span className="text-xs font-bold">{st.time}</span>
                                <span className="text-[9px] opacity-85 font-medium">{st.format} • {priceFormatted}</span>
                                {isExpired && (
                                  <span className="text-[8px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5 border border-rose-100">
                                    Show Ended
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: THEATRE-SPECIFIC SEAT SELECTION */}
          {currentTheatre && currentShowtime && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A1D24] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#F84464] text-white flex items-center justify-center text-xs font-black">3</span>
                    <span>Select Seats ({currentTheatre.seatLayout.layoutName})</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Screening at <strong className="text-[#1A1D24]">{currentTheatre.name}</strong> @ {currentShowtime.time}
                  </p>
                </div>

                {/* Seat Color Legend - BookMyShow Standard */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-white border border-emerald-500 text-emerald-600 flex items-center justify-center text-[9px] font-bold">A</div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-[#F84464] border border-[#DC2626] text-white flex items-center justify-center text-[9px] font-bold shadow-sm">S</div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 text-gray-400 flex items-center justify-center text-[9px] font-bold opacity-70">X</div>
                    <span>Occupied / Sold</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-amber-50 border border-amber-400 text-amber-700 flex items-center justify-center text-[9px] font-bold">V</div>
                    <span>VIP Recliner</span>
                  </div>
                </div>
              </div>

              {/* Curved Cinema Screen Visual */}
              <div className="w-full flex flex-col items-center py-4">
                <div className="w-3/4 max-w-lg h-3 bg-gradient-to-r from-gray-200 via-[#F84464]/80 to-gray-200 rounded-t-full shadow-inner opacity-80" />
                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 mt-2">
                  All eyes this way — CINEMA SCREEN
                </span>
              </div>

              {/* Dynamic Theatre Seat Map Grid with Category Dividers */}
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center overflow-x-auto">
                <div className="space-y-4 min-w-[340px]">
                  
                  {/* VIP Category Header */}
                  {currentTheatre.seatLayout.vipRows.length > 0 && (
                    <div className="w-full text-center border-b border-amber-200 pb-1 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 inline-block">
                        VIP Recliner Seats — {formatPrice((currentShowtime.basePriceUSD * 1.35), selectedLocation)}
                      </span>
                    </div>
                  )}

                  {currentTheatre.seatLayout.rows.map((rowName, idx) => {
                    const isVipRow = currentTheatre.seatLayout.vipRows.includes(rowName);
                    const showExecutiveHeader = !isVipRow && idx === currentTheatre.seatLayout.vipRows.length;

                    return (
                      <React.Fragment key={rowName}>
                        {showExecutiveHeader && (
                          <div className="w-full text-center border-b border-gray-200 pt-3 pb-1 my-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-200 inline-block">
                              Executive Seats — {formatPrice(currentShowtime.basePriceUSD, selectedLocation)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 sm:gap-3 justify-center">
                          {/* Left Row Name Label */}
                          <span className="w-6 text-center font-extrabold text-xs text-gray-500">
                            {rowName}
                          </span>

                          {/* Seat Buttons */}
                          <div className="flex items-center gap-2">
                            {currentTheatre.seatLayout.seatNumbers.map((seatNum) => {
                              const seatId = `${rowName}${seatNum}`;
                              const isOccupied = occupiedSeats.includes(seatId);
                              const isSelected = bookingState.selectedSeats.includes(seatId);

                              return (
                                <button
                                  key={seatId}
                                  disabled={isOccupied}
                                  onClick={() => toggleSeat(seatId)}
                                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                                    isOccupied
                                      ? 'bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed line-through opacity-70'
                                      : isSelected
                                      ? 'bg-[#F84464] border border-[#DC2626] text-white shadow-md font-black scale-105'
                                      : isVipRow
                                      ? 'bg-amber-50 border border-amber-400 text-amber-800 hover:bg-[#F84464] hover:border-[#F84464] hover:text-white'
                                      : 'bg-white border border-emerald-600 text-emerald-700 hover:bg-[#F84464] hover:border-[#F84464] hover:text-white'
                                  }`}
                                >
                                  {seatNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Row Name Label */}
                          <span className="w-6 text-center font-extrabold text-xs text-gray-500">
                            {rowName}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SYNOPSIS */}
      {activeTab === 'synopsis' && (
        <div className="p-6 bg-white border border-gray-200 rounded-3xl space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed shadow-sm">
          <h3 className="font-extrabold text-base text-[#1A1D24]">Full Storyline</h3>
          <p>{movie.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Release Date</span>
              <span className="font-bold text-[#1A1D24]">{movie.releaseDate}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Age Rating</span>
              <span className="font-bold text-[#1A1D24]">{movie.ageRating}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Director</span>
              <span className="font-bold text-[#1A1D24]">{movie.director}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CAST */}
      {activeTab === 'cast' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {movie.cast.map((actor) => (
            <div key={actor.id} className="p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-3 shadow-sm">
              <img src={actor.avatar} alt={actor.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
              <div>
                <h4 className="font-bold text-xs text-[#1A1D24]">{actor.name}</h4>
                <p className="text-[10px] text-gray-500">{actor.character}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PERSISTENT STICKY BOOKING SUMMARY BAR */}
      {currentTheatre && currentShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 sm:px-8 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                  {bookingState.selectedSeats.length > 0 ? `${bookingState.selectedSeats.length} Seats Selected` : 'Select Seats to Proceed'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#F84464]">
                    {formatPrice(totalPriceUSD, selectedLocation)}
                  </span>
                  {bookingState.selectedSeats.length > 0 && (
                    <span className="text-xs text-gray-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      Seats: {bookingState.selectedSeats.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="hidden lg:block text-right text-xs text-gray-600">
                <p className="font-bold text-[#1A1D24]">{currentTheatre.name}</p>
                <p className="text-[10px] text-gray-500">{selectedDate} @ {currentShowtime.time}</p>
              </div>

              {(() => {
                const isCurrentExpired = isShowtimeExpired(selectedDate, currentShowtime.time, movie.duration);
                return (
                  <button
                    disabled={bookingState.selectedSeats.length === 0 || isCurrentExpired}
                    onClick={() => {
                      if (!isCurrentExpired) {
                        onOpenPaymentModal();
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isCurrentExpired ? 'Show Ended' : 'Book Now & Pay'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

