import React, { useState } from 'react';
import { 
  Film, Search, MapPin, Wallet, Menu, X, Ticket, Sparkles, 
  ChevronDown, Check 
} from 'lucide-react';
import { PageType, WalletState } from '../types';
import { LOCATIONS, getCurrencyForLocation } from '../data/mockData';

interface NavbarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  walletState: WalletState;
  onOpenWalletModal: () => void;
  myBookingsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  selectedLocation,
  onLocationChange,
  searchQuery,
  onSearchChange,
  walletState,
  onOpenWalletModal,
  myBookingsCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const activeCurrency = getCurrencyForLocation(selectedLocation);

  const navItems: { id: PageType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Film className="w-4 h-4" /> },
    { id: 'movies', label: 'Movies', icon: <Ticket className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'my-bookings', label: 'My Bookings', icon: <Ticket className="w-4 h-4" />, badge: myBookingsCount }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full clean-nav transition-all bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#F84464] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-white transform -rotate-12" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#1A1D24] group-hover:text-[#F84464] transition-colors">
                Block<span className="text-[#F84464]">Tix</span>
              </span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gray-500">
                CINEMA TICKETS
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-[#F84464] text-white shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                      isActive ? 'bg-white text-[#F84464]' : 'bg-[#F84464] text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar & Controls */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentPage !== 'movies') onNavigate('movies');
                }}
                placeholder="Search movies, events..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F84464] transition-colors"
              />
            </div>
          </div>

          {/* Location & Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-gray-100 border border-gray-200 hover:bg-gray-200/60 rounded-xl text-xs font-bold text-gray-800 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F84464]" />
              <span className="truncate max-w-[130px] text-gray-800">{selectedLocation}</span>
              <span className="px-1.5 py-0.5 bg-red-50 text-[#F84464] text-[10px] font-extrabold rounded border border-red-100">
                {activeCurrency.symbol} {activeCurrency.code}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {locationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Select Location & Currency</span>
                  <span className="text-[10px] text-[#F84464]">Updates prices & payment gateways</span>
                </div>
                {LOCATIONS.map((loc) => {
                  const curr = getCurrencyForLocation(loc);
                  const isSelected = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        onLocationChange(loc);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                        isSelected
                          ? 'bg-red-50 text-[#F84464] font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{loc}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {curr.symbol} {curr.code}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#F84464]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Web3 Wallet Button */}
          <button
            onClick={onOpenWalletModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              walletState.connected
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                : 'bg-[#F84464] hover:bg-[#E03352] text-white shadow-sm'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>
              {walletState.connected
                ? `${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`
                : 'Connect Wallet'}
            </span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-black"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-6 space-y-4 animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${
                  currentPage === item.id ? 'bg-[#F84464] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-[#F84464] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

