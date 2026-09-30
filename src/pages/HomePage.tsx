import React from 'react';
import { 
  Sparkles, Ticket, Calendar, Star, ChevronRight, 
  ShieldCheck, Zap, RefreshCw, Award 
} from 'lucide-react';
import { Movie, EventItem, PageType } from '../types';
import { MovieCard } from '../components/MovieCard';
import { EventCard } from '../components/EventCard';
import { SYSTEM_CURRENT_DATE } from '../data/mockData';

interface HomePageProps {
  movies: Movie[];
  events: EventItem[];
  selectedLocation: string;
  onNavigate: (page: PageType, movieId?: string) => void;
  onSelectEvent: (event: EventItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  movies,
  events,
  selectedLocation,
  onNavigate,
  onSelectEvent
}) => {
  const nowShowingMovies = movies.filter((m) => m.status === 'now_showing');

  // Requirement #4: Upcoming movies filter logic relative to system date runtime
  const systemTime = new Date(SYSTEM_CURRENT_DATE).getTime();
  const upcomingMovies = movies.filter((m) => {
    const movieReleaseTime = new Date(m.releaseDate).getTime();
    return m.status === 'upcoming' && movieReleaseTime > systemTime;
  });

  const featuredMovie = nowShowingMovies[0] || movies[0];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden border border-gray-200 bg-white p-6 sm:p-10 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-[#F84464] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F84464]" />
              <span>BLOCKBUSTER PREMIERE</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-amber-600 font-extrabold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9 (124.5k votes)
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1A1D24] tracking-tight leading-[1.15]">
              Experience Cinema Beyond <span className="text-[#F84464]">The Screen.</span>
            </h1>

            <p className="text-gray-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Book tickets for top-rated blockbusters, exclusive live concerts, and global showtimes with guaranteed seat selection & instant digital passes.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('movies')}
                className="px-6 py-3.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>Explore Movies</span>
              </button>

              <button
                onClick={() => onNavigate('events')}
                className="px-6 py-3.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#F84464]" />
                <span>Explore Events</span>
              </button>
            </div>
          </div>

          {/* Right Featured Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div 
              onClick={() => onNavigate('movie-details', featuredMovie.id)}
              className="group relative w-full max-w-xs sm:max-w-sm aspect-[2/3] rounded-3xl overflow-hidden shadow-md border border-gray-200 cursor-pointer transition-transform duration-500 hover:-translate-y-1.5"
            >
              <img
                src={featuredMovie.poster}
                alt={featuredMovie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
              
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F84464] block bg-black/60 backdrop-blur-sm w-fit px-2.5 py-1 rounded-md border border-white/10">
                  FEATURED MOVIE
                </span>
                <h3 className="font-extrabold text-xl text-white group-hover:text-red-300 transition-colors">
                  {featuredMovie.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-300 pt-1">
                  <span>{featuredMovie.duration} • {featuredMovie.genre[0]}</span>
                  <span className="font-bold text-[#F84464] flex items-center gap-1">
                    Book Now <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOW SHOWING MOVIES GRID */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#1A1D24] tracking-tight flex items-center gap-2">
              <span>Now Showing</span>
              <span className="px-2.5 py-0.5 bg-red-50 text-[#F84464] rounded-full text-xs font-extrabold border border-red-100">
                {nowShowingMovies.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Catch the latest blockbuster premieres in IMAX & 4DX</p>
          </div>

          <button
            onClick={() => onNavigate('movies')}
            className="flex items-center gap-1 text-xs font-extrabold text-[#F84464] hover:text-[#E03352] transition-colors"
          >
            <span>View All Movies</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nowShowingMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelectMovie={(id) => onNavigate('movie-details', id)}
            />
          ))}
        </div>
      </section>

      {/* UPCOMING MOVIES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#1A1D24] tracking-tight flex items-center gap-2">
              <span>Upcoming Blockbusters</span>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-extrabold border border-gray-200">
                {upcomingMovies.length} Releasing Soon
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Movies releasing after {SYSTEM_CURRENT_DATE}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {upcomingMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelectMovie={(id) => onNavigate('movie-details', id)}
            />
          ))}
        </div>
      </section>

      {/* POPULAR EVENTS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#1A1D24] tracking-tight">Popular Events & Concerts</h2>
            <p className="text-xs text-gray-500 mt-1">Live concerts, gaming championships, and comedy shows</p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="flex items-center gap-1 text-xs font-extrabold text-[#F84464] hover:text-[#E03352] transition-colors"
          >
            <span>Explore All Events</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.slice(0, 4).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              selectedLocation={selectedLocation}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      </section>

      {/* WHY BLOCKTIX BENEFITS SECTION */}
      <section className="p-8 sm:p-12 rounded-3xl bg-white border border-gray-200 space-y-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F84464]">
            MODERN TICKETING PLATFORM
          </span>
          <h2 className="text-3xl font-black text-[#1A1D24]">Why Film Fans & Event-Goers Choose BlockTix</h2>
          <p className="text-xs text-gray-500">Fair pricing, 100% verified digital entry passes, and seamless cinema seat bookings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-red-50 text-[#F84464] border border-red-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#1A1D24] text-base">Verified Digital Passes</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every booking is encoded with a unique verification hash to eliminate counterfeit tickets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-red-50 text-[#F84464] border border-red-100">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#1A1D24] text-base">Instant Entry QR</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Scan your mobile QR ticket code directly at cinema doors or stadium entry gates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-red-50 text-[#F84464] border border-red-100">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#1A1D24] text-base">Flexible Cancellation</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Plans changed? Cancel your ticket easily from My Bookings with full record tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="p-3 w-fit rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#1A1D24] text-base">Global Currencies</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Support for USD, INR, GBP, JPY, CAD and local payment gateways like UPI, Apple Pay, and cards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

