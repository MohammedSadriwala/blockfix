import React, { useState } from 'react';
import { Search, Filter, RefreshCcw, Film } from 'lucide-react';
import { Movie, PageType } from '../types';
import { MovieCard } from '../components/MovieCard';
import { GENRES, LANGUAGES } from '../data/mockData';

interface MoviesPageProps {
  movies: Movie[];
  onSelectMovie: (movieId: string) => void;
  selectedLocation: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  movies,
  onSelectMovie,
  selectedLocation,
  searchQuery,
  onSearchChange
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All Languages');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest'>('popularity');

  // Dynamic Filtering Logic
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = searchQuery === '' || 
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = selectedGenre === 'All Genres' || movie.genre.includes(selectedGenre);
    const matchesLanguage = selectedLanguage === 'All Languages' || movie.language.includes(selectedLanguage);

    return matchesSearch && matchesGenre && matchesLanguage;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    return (a.trendingRank || 99) - (b.trendingRank || 99);
  });

  const resetFilters = () => {
    setSelectedGenre('All Genres');
    setSelectedLanguage('All Languages');
    onSearchChange('');
    setSortBy('popularity');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F84464] block">
            CINEMA SELECTION
          </span>
          <h1 className="text-3xl font-black text-[#1A1D24] tracking-tight flex items-center gap-3 mt-1">
            <span>Explore Cinema Listings</span>
            <span className="px-3 py-1 bg-red-50 text-[#F84464] border border-red-100 rounded-full text-xs font-extrabold">
              {filteredMovies.length} Movies Available
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing screenings in <strong className="text-[#1A1D24] font-extrabold">{selectedLocation}</strong> with live date & theatre schedules.
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title or genre..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
            />
          </div>

          {/* Genre Dropdown */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Language Dropdown */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
          >
            <option value="popularity">Sort: Trending & Popular</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="newest">Sort: Release Date</option>
          </select>
        </div>

        {/* Filter Pills & Reset */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-3.5 h-3.5 text-[#F84464]" />
            <span className="font-semibold">Active Filters:</span>
            {selectedGenre !== 'All Genres' && (
              <span className="px-2.5 py-0.5 bg-red-50 text-[#F84464] border border-red-100 rounded font-bold">
                {selectedGenre}
              </span>
            )}
            {selectedLanguage !== 'All Languages' && (
              <span className="px-2.5 py-0.5 bg-red-50 text-[#F84464] border border-red-100 rounded font-bold">
                {selectedLanguage}
              </span>
            )}
            {selectedGenre === 'All Genres' && selectedLanguage === 'All Languages' && !searchQuery && (
              <span className="text-gray-400 font-medium">None</span>
            )}
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#F84464] font-bold transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center space-y-3 shadow-sm">
          <Film className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
          <h3 className="font-extrabold text-[#1A1D24] text-lg">No Movies Match Your Filter</h3>
          <p className="text-xs text-gray-500">Try adjusting your search query, genre, or language filters.</p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-[#F84464] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#E03352]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelectMovie={onSelectMovie}
            />
          ))}
        </div>
      )}
    </div>
  );
};

