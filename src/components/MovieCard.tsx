import React from 'react';
import { Star, Clock, Globe, Ticket, Calendar } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelectMovie }) => {
  const isNowShowing = movie.status === 'now_showing';

  return (
    <div 
      onClick={() => onSelectMovie(movie.id)}
      className="group relative bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col h-full"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-70 group-hover:opacity-80 transition-opacity" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/20 text-xs font-bold text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{movie.rating}</span>
        </div>

        {/* Status / Trending Badge */}
        {movie.trendingRank && isNowShowing && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#F84464] text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            #{movie.trendingRank} Trending
          </div>
        )}

        {!isNowShowing && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-gray-800 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            Coming Soon
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/35 backdrop-blur-[2px]">
          <span className="px-5 py-2.5 rounded-full bg-[#F84464] text-white font-extrabold text-xs tracking-wider uppercase shadow-md transform scale-95 group-hover:scale-100 transition-transform">
            {isNowShowing ? 'Book Tickets' : 'View Details'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <h3 className="font-extrabold text-base text-[#1A1D24] group-hover:text-[#F84464] transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {movie.genre.slice(0, 2).map((g) => (
              <span key={g} className="px-2 py-0.5 bg-gray-100 text-[#4B5563] text-[10px] font-semibold rounded-md border border-gray-200">
                {g}
              </span>
            ))}
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md border border-gray-200 font-semibold">
              {movie.ageRating}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-[#F84464]" />
            {movie.duration}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Globe className="w-3 h-3 text-gray-400" />
            {movie.language[0]}
          </span>
        </div>

        {isNowShowing ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectMovie(movie.id);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#F84464] hover:bg-[#E03352] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-[#F84464]" />
            <span>Releasing {movie.releaseDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

