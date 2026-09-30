import React from 'react';
import { Ticket, Twitter, Github, Disc as Discord, ShieldCheck, Zap, Heart } from 'lucide-react';
import { PageType } from '../types';

interface FooterProps {
  onNavigate: (page: PageType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1F2533] text-gray-300 mt-20 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F84464] flex items-center justify-center text-white shadow-sm">
                <Ticket className="w-5 h-5 -rotate-12" />
              </div>
              <span className="text-xl font-black text-white">
                Block<span className="text-[#F84464]">Tix</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              The next-generation movie and live event ticketing platform. Experience instant verifiable digital passes, interactive seat selection, and seamless cinema bookings.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-2">
              <span className="flex items-center gap-1.5 text-gray-300">
                <Zap className="w-3.5 h-3.5 text-[#F84464]" /> Instant Confirmation
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F84464]" /> 100% Authentic Tickets
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#F84464] transition-colors text-gray-300">Home</button>
              </li>
              <li>
                <button onClick={() => onNavigate('movies')} className="hover:text-[#F84464] transition-colors text-gray-300">Now Showing Movies</button>
              </li>
              <li>
                <button onClick={() => onNavigate('movies')} className="hover:text-[#F84464] transition-colors text-gray-300">Upcoming Releases</button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-[#F84464] transition-colors text-gray-300">Live Concerts & Events</button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Experience</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="hover:text-[#F84464] transition-colors cursor-pointer">IMAX 3D Laser</li>
              <li className="hover:text-[#F84464] transition-colors cursor-pointer">Dolby Atmos Audio</li>
              <li className="hover:text-[#F84464] transition-colors cursor-pointer">4DX Motion Seats</li>
              <li className="hover:text-[#F84464] transition-colors cursor-pointer">Digital Ticket Vault</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stay In The Loop</h4>
            <p className="text-xs text-gray-400">Subscribe for early access passes and exclusive premiere discounts.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#F84464]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#F84464] hover:bg-[#E03352] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            © {new Date().getFullYear()} BlockTix Platform Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors">
              <Discord className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

