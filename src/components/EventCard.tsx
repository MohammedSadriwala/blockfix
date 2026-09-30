import React from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { EventItem } from '../types';
import { formatPrice } from '../data/mockData';

interface EventCardProps {
  event: EventItem;
  selectedLocation: string;
  onSelectEvent: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, selectedLocation, onSelectEvent }) => {
  return (
    <div 
      onClick={() => onSelectEvent(event)}
      className="group relative bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col h-full"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#F84464]" />
          <span>{event.date}</span>
        </div>

        {event.tag && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#F84464] text-white rounded-full text-[10px] font-extrabold uppercase shadow-sm">
            {event.tag}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F84464] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {event.category}
          </span>
          <h3 className="font-extrabold text-base text-[#1A1D24] group-hover:text-[#F84464] transition-colors line-clamp-1 mt-1">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {event.description}
          </p>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate font-medium">{event.venue}, {event.city}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-medium">From</span>
              <span className="text-base font-extrabold text-[#1A1D24]">
                {formatPrice(event.basePriceUSD, selectedLocation)}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(event);
              }}
              className="px-4 py-2 bg-[#F84464] hover:bg-[#E03352] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Book Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

