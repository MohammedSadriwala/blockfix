import React, { useState, useEffect, useCallback } from 'react';
import { PageType, Movie, EventItem, BookingState, WalletState, BookingTicket } from './types';
import { MOVIES, EVENTS, INITIAL_BOOKINGS, getAvailableDates } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WalletModal } from './components/WalletModal';
import { PaymentModal } from './components/PaymentModal';
import { EventBookingModal } from './components/EventBookingModal';

import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { EventsPage } from './pages/EventsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { checkIsSepoliaNetwork, connectMetaMask, isMetaMaskInstalled, fetchWalletBalance } from './utils/web3Service';
import { SEPOLIA_CHAIN_ID_DECIMAL } from './config/contractConfig';
import { getActiveBookings } from './utils/bookingTimeUtils';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('mv-1');
  const [selectedLocation, setSelectedLocation] = useState<string>('New York, USA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Web3 Wallet State
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    balance: 0,
    nftsCount: 0,
    chainId: null
  });

  // Real-Time Data Fetching: Refresh real Sepolia ETH balance from blockchain provider
  const refreshWalletBalance = useCallback(async (addressOverride?: string) => {
    const targetAddress = addressOverride || walletState.address;
    if (!targetAddress) return;
    const realOnChainBalance = await fetchWalletBalance(targetAddress);
    setWalletState((prev) => ({
      ...prev,
      balance: realOnChainBalance
    }));
  }, [walletState.address]);

  // User Bookings with LocalStorage persistence
  const [myBookings, setMyBookings] = useState<BookingTicket[]>(() => {
    try {
      const saved = localStorage.getItem('blocktix_my_bookings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load bookings from localStorage:', e);
    }
    return INITIAL_BOOKINGS;
  });

  // Sync myBookings to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('blocktix_my_bookings', JSON.stringify(myBookings));
    } catch (e) {
      console.error('Failed to save bookings to localStorage:', e);
    }
  }, [myBookings]);

  // Listen for MetaMask account / network changes if available
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({ connected: false, address: null, balance: 0, nftsCount: 0, chainId: null });
        } else {
          const res = await connectMetaMask();
          if (res.connected && res.address) {
            setWalletState({
              connected: true,
              address: res.address,
              balance: res.balance,
              nftsCount: 1,
              chainId: res.chainId
            });
          }
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      ethereum.on?.('accountsChanged', handleAccountsChanged);
      ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Modals state
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);

  // Preserved Booking State map per Movie ID
  const [bookingStatesMap, setBookingStatesMap] = useState<Record<string, BookingState>>({});

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedMovieId]);

  // Handle navigation
  const handleNavigate = (page: PageType, movieId?: string) => {
    if (movieId) {
      setSelectedMovieId(movieId);
    }
    setCurrentPage(page);
  };

  // Get or initialize booking state for currently selected movie
  const currentMovie = MOVIES.find((m) => m.id === selectedMovieId) || MOVIES[0];
  const availableDatesList = getAvailableDates(currentMovie.releaseDate);
  const defaultDate = availableDatesList[0].fullDate;

  const availableTheatresForDefaultDate = currentMovie.theatres.filter(
    (th) => th.availableDates.includes(defaultDate) && (th.dateSchedules[defaultDate]?.length ?? 0) > 0
  );
  const initialTheatre = availableTheatresForDefaultDate[0] || currentMovie.theatres[0];
  const initialShowtime = initialTheatre?.dateSchedules[defaultDate]?.[0] || Object.values(initialTheatre?.dateSchedules || {})[0]?.[0];

  const currentBookingState: BookingState = bookingStatesMap[currentMovie.id] || {
    movieId: currentMovie.id,
    selectedDate: defaultDate,
    selectedTheatreId: initialTheatre?.id || null,
    selectedShowtimeId: initialShowtime?.id || null,
    selectedSeats: [],
    seatPriceUSD: initialShowtime?.basePriceUSD || 20.0
  };

  const handleUpdateBookingState = (partial: Partial<BookingState>) => {
    setBookingStatesMap((prev) => ({
      ...prev,
      [currentMovie.id]: {
        ...currentBookingState,
        ...partial
      }
    }));
  };

  const handleConnectWallet = (address: string, initialBalance?: number, chainId?: number) => {
    setWalletState({
      connected: true,
      address,
      balance: initialBalance !== undefined ? initialBalance : 0,
      nftsCount: 1,
      chainId: chainId || SEPOLIA_CHAIN_ID_DECIMAL
    });
    // Immediately fetch real-time on-chain balance from Sepolia provider
    fetchWalletBalance(address).then((realBalance) => {
      setWalletState((prev) => ({ ...prev, balance: realBalance }));
    });
  };

  const handleDisconnectWallet = () => {
    setWalletState({
      connected: false,
      address: null,
      balance: 0,
      nftsCount: 0,
      chainId: null
    });
  };

  const handleConfirmMovieBooking = (ticket: BookingTicket) => {
    setMyBookings((prev) => [ticket, ...prev]);
    handleUpdateBookingState({ selectedSeats: [] });
  };

  const handleConfirmEventBooking = (ticket: BookingTicket) => {
    setMyBookings((prev) => [ticket, ...prev]);
  };

  const handleCancelBooking = (bookingId: string, refundTxHash?: string) => {
    setMyBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Cancelled' as const, refundTxHash: refundTxHash || b.refundTxHash }
          : b
      )
    );
  };

  const handleClearHistory = () => {
    setMyBookings([]);
    try {
      localStorage.setItem('blocktix_my_bookings', '[]');
    } catch (e) {
      console.error('Failed to clear bookings in localStorage:', e);
    }
  };

  // Active Theatre & Showtime for Payment modal
  const activeTheatre = currentMovie.theatres.find((t) => t.id === currentBookingState.selectedTheatreId) || currentMovie.theatres[0];
  const activeShowtimes = activeTheatre?.dateSchedules[currentBookingState.selectedDate] || [];
  const activeShowtime = activeShowtimes.find((st) => st.id === currentBookingState.selectedShowtimeId) || activeShowtimes[0];

  const activeBookingsCount = getActiveBookings(myBookings).length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1D24] flex flex-col font-sans selection:bg-[#F84464] selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        walletState={walletState}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        myBookingsCount={activeBookingsCount}
      />

      {/* Main Page Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentPage === 'home' && (
          <HomePage
            movies={MOVIES}
            events={EVENTS}
            selectedLocation={selectedLocation}
            onNavigate={handleNavigate}
            onSelectEvent={(ev) => setSelectedEventModal(ev)}
          />
        )}

        {currentPage === 'movies' && (
          <MoviesPage
            movies={MOVIES}
            onSelectMovie={(id) => handleNavigate('movie-details', id)}
            selectedLocation={selectedLocation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentPage === 'movie-details' && (
          <MovieDetailsPage
            movie={currentMovie}
            bookingState={currentBookingState}
            onUpdateBookingState={handleUpdateBookingState}
            onNavigate={handleNavigate}
            onOpenPaymentModal={() => setPaymentModalOpen(true)}
            selectedLocation={selectedLocation}
            myBookings={myBookings}
          />
        )}

        {currentPage === 'events' && (
          <EventsPage
            events={EVENTS}
            selectedLocation={selectedLocation}
            onSelectEvent={(ev) => setSelectedEventModal(ev)}
          />
        )}

        {currentPage === 'my-bookings' && (
          <MyBookingsPage
            bookings={myBookings}
            walletState={walletState}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onNavigate={handleNavigate}
            onCancelBooking={handleCancelBooking}
            onClearHistory={handleClearHistory}
            onRefreshBalance={refreshWalletBalance}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Web3 Wallet Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onRefreshBalance={refreshWalletBalance}
      />

      {/* Payment Checkout Modal for Movie Booking */}
      {activeTheatre && activeShowtime && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          movie={currentMovie}
          selectedDate={currentBookingState.selectedDate}
          theatre={activeTheatre}
          showtime={activeShowtime}
          selectedSeats={currentBookingState.selectedSeats}
          selectedLocation={selectedLocation}
          walletState={walletState}
          onOpenWalletModal={() => setWalletModalOpen(true)}
          onConnectWallet={handleConnectWallet}
          onConfirmBooking={handleConfirmMovieBooking}
          onNavigateToBookings={() => handleNavigate('my-bookings')}
          onRefreshBalance={refreshWalletBalance}
        />
      )}

      {/* Multi-Tier Event Booking Modal */}
      {selectedEventModal && (
        <EventBookingModal
          isOpen={!!selectedEventModal}
          onClose={() => setSelectedEventModal(null)}
          event={selectedEventModal}
          selectedLocation={selectedLocation}
          walletState={walletState}
          onOpenWalletModal={() => setWalletModalOpen(true)}
          onConnectWallet={handleConnectWallet}
          onConfirmEventBooking={handleConfirmEventBooking}
          onNavigateToBookings={() => handleNavigate('my-bookings')}
          onRefreshBalance={refreshWalletBalance}
        />
      )}
    </div>
  );
};
