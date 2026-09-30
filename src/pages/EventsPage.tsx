import React, { useState } from 'react';
import { Sparkles, Calendar, Search } from 'lucide-react';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';

interface EventsPageProps {
  events: EventItem[];
  selectedLocation: string;
  onSelectEvent: (event: EventItem) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  selectedLocation,
  onSelectEvent
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All Categories', 'Music Concert', 'Conference', 'Gaming', 'Comedy'];

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = selectedCategory === 'All Categories' || ev.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F84464] block">
            LIVE EXPERIENCES
          </span>
          <h1 className="text-3xl font-black text-[#1A1D24] tracking-tight flex items-center gap-3 mt-1">
            <span>Live Events & VIP Passes</span>
            <span className="px-3 py-1 bg-red-50 text-[#F84464] border border-red-100 rounded-full text-xs font-extrabold">
              {filteredEvents.length} Events Listed
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Exclusive music festivals, tech keynotes, esports grand finals, and comedy shows in <strong className="text-[#1A1D24] font-extrabold">{selectedLocation}</strong>.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#F84464] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events or venues..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selectedLocation={selectedLocation}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
};

