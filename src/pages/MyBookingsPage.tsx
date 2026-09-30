import React, { useState } from 'react';
import { 
  Ticket, Calendar, MapPin, QrCode, XCircle, CheckCircle, 
  Trash2, Eye, ShieldCheck, Sparkles, AlertTriangle, AlertCircle, RefreshCw, Clock, ExternalLink, Lock
} from 'lucide-react';
import { BookingTicket, PageType, WalletState, isBlockchainBooking } from '../types';
import { formatBookingTime } from '../data/mockData';
import { executeBookingRefundOnChain, checkIsSepoliaNetwork, switchToSepoliaNetwork, isMetaMaskInstalled, formatEthBalance } from '../utils/web3Service';
import { getActiveBookings, getCancelledBookings, getAllBookingHistory, isBookingShowEnded } from '../utils/bookingTimeUtils';

interface MyBookingsPageProps {
  bookings: BookingTicket[];
  walletState?: WalletState;
  onOpenWalletModal?: () => void;
  onNavigate: (page: PageType) => void;
  onCancelBooking: (bookingId: string, refundTxHash?: string) => void;
  onClearHistory: () => void;
  onRefreshBalance?: () => Promise<void> | void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  bookings,
  walletState,
  onOpenWalletModal,
  onNavigate,
  onCancelBooking,
  onClearHistory,
  onRefreshBalance
}) => {
  const [selectedTicketModal, setSelectedTicketModal] = useState<BookingTicket | null>(null);
  const [ticketToCancel, setTicketToCancel] = useState<BookingTicket | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [clearNotification, setClearNotification] = useState<boolean>(false);
  const [cancelNotification, setCancelNotification] = useState<{
    show: boolean;
    ticketCode: string;
    movieTitle: string;
    amount: string;
    refundTxHash?: string;
  } | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'active' | 'cancelled'>('active');

  const activeBookings = getActiveBookings(bookings);
  const cancelledBookings = getCancelledBookings(bookings);
  const historyBookings = getAllBookingHistory(bookings);

  const displayedBookings = 
    activeTabFilter === 'active' 
      ? activeBookings 
      : activeTabFilter === 'cancelled' 
      ? cancelledBookings 
      : historyBookings;

  // Conditional Cancellation Workflow based strictly on the booking's stored payment type
  const handleConfirmCancel = async () => {
    if (!ticketToCancel) return;
    setCancelError(null);

    const isBlockchain = isBlockchainBooking(ticketToCancel);

    if (isBlockchain) {
      // 1. Blockchain-Paid Booking Workflow: Requires MetaMask connection & Sepolia refund transaction
      if (!isMetaMaskInstalled()) {
        setCancelError('MetaMask extension is required to process blockchain 0.01 ETH refund.');
        return;
      }

      // Verify MetaMask wallet connection before executing cancelBooking()
      if (!walletState?.connected || !walletState?.address) {
        if (onOpenWalletModal) {
          onOpenWalletModal();
        }
        setCancelError('Wallet connection required: Please connect your MetaMask wallet to initiate the 0.01 ETH refund.');
        return;
      }

      // Check Sepolia Network
      const isSepolia = await checkIsSepoliaNetwork();
      if (!isSepolia) {
        const switched = await switchToSepoliaNetwork();
        if (!switched) {
          setCancelError('Network Validation Failed: Must be connected to Sepolia Testnet (Chain ID: 11155111) for refunds.');
          return;
        }
      }

      setIsCancelling(true);

      // Trigger 0.01 ETH Refund Smart Contract Transaction on Sepolia
      const refundResult = await executeBookingRefundOnChain(ticketToCancel.bookingCode || ticketToCancel.id);

      setIsCancelling(false);

      if (!refundResult.success || !refundResult.txHash) {
        setCancelError(refundResult.error || 'Refund transaction rejected or failed on Sepolia blockchain.');
        return;
      }

      // Dynamic Updates: Re-fetch real balance directly from blockchain provider
      if (onRefreshBalance) {
        await onRefreshBalance();
      }

      const ticket = ticketToCancel;
      onCancelBooking(ticket.id, refundResult.txHash);
      
      setCancelNotification({
        show: true,
        ticketCode: ticket.bookingCode,
        movieTitle: ticket.movieTitle,
        amount: `0.01 ETH (Sepolia Testnet)`,
        refundTxHash: refundResult.txHash
      });

      setTicketToCancel(null);

      setTimeout(() => {
        setCancelNotification(null);
      }, 8000);

    } else {
      // 2. Non-Blockchain (Off-Chain / Standard) Booking Workflow
      // Strictly NO smart contract calls, NO MetaMask connection requirement
      setIsCancelling(true);
      const ticket = ticketToCancel;
      onCancelBooking(ticket.id);
      setIsCancelling(false);

      setCancelNotification({
        show: true,
        ticketCode: ticket.bookingCode,
        movieTitle: ticket.movieTitle,
        amount: `${ticket.currencySymbol || '$'}${ticket.totalPrice.toFixed(2)} (Standard Refund)`
      });

      setTicketToCancel(null);

      setTimeout(() => {
        setCancelNotification(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Confirmation Notification for Cancel */}
      {cancelNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
              ✓
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-emerald-950">
                Booking Cancelled Successfully!
              </h4>
              <p className="text-xs text-emerald-800">
                Ticket <strong className="font-mono">{cancelNotification.ticketCode}</strong> for <strong>"{cancelNotification.movieTitle}"</strong> has been cancelled. Refund of <strong>{cancelNotification.amount}</strong> processed.
              </p>
              {cancelNotification.refundTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${cancelNotification.refundTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-emerald-900 hover:text-black underline flex items-center gap-1 font-bold pt-0.5"
                >
                  <span>Refund Tx: {cancelNotification.refundTxHash}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setCancelNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 text-sm font-black px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification for Clear History */}
      {clearNotification && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-blue-950">
                Booking History Cleared
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                All booking records have been removed successfully from your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setClearNotification(false)}
            className="text-blue-700 hover:text-blue-950 text-sm font-black px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F84464] block">
            MY ACCOUNT
          </span>
          <h1 className="text-3xl font-black text-[#1A1D24] tracking-tight flex items-center gap-3 mt-1">
            <span>My Bookings & Smart Passes</span>
            <span className="px-3 py-1 bg-red-50 border border-red-100 text-[#F84464] rounded-full text-xs font-extrabold">
              {activeBookings.length} Active
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Access your confirmed cinema tickets or manage cancellations and smart contract refunds.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {bookings.length > 0 && activeTabFilter === 'all' && (
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('movies')}
            className="px-5 py-2.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            <span>Book New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTabFilter === 'active'
                ? 'bg-[#F84464] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${activeTabFilter === 'active' ? 'text-white' : 'text-emerald-500'}`} />
            <span>Active Bookings ({activeBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTabFilter === 'cancelled'
                ? 'bg-[#F84464] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <XCircle className={`w-3.5 h-3.5 ${activeTabFilter === 'cancelled' ? 'text-white' : 'text-rose-500'}`} />
            <span>Cancelled ({cancelledBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTabFilter === 'all'
                ? 'bg-[#F84464] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>All History ({bookings.length})</span>
          </button>
        </div>

        {/* Clear History Button */}
        {bookings.length > 0 && activeTabFilter === 'all' && (
          <button
            onClick={() => setShowClearConfirmModal(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Main Content View */}
      {displayedBookings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-[#F84464] border border-red-100 flex items-center justify-center">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-xl text-[#1A1D24]">
            {activeTabFilter === 'cancelled' ? 'No Cancelled Bookings' : 'No Active Bookings'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTabFilter === 'cancelled'
              ? 'You do not have any cancelled movie or event bookings.'
              : "You don't have any active cinema tickets or event passes right now."}
          </p>
          {activeTabFilter !== 'cancelled' && (
            <button
              onClick={() => onNavigate('movies')}
              className="px-6 py-3 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs rounded-xl shadow-sm"
            >
              Explore Movies & Events
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Movie & Event Ticket Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedBookings.map((item) => {
              const isConfirmed = item.status === 'Confirmed';
              const isEnded = isBookingShowEnded(item);
              const isEvent = item.type === 'event';
              const isBlockchain = isBlockchainBooking(item);

              return (
                <div
                  key={item.id}
                  className={`relative rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between bg-white shadow-sm hover:shadow-md ${
                    isConfirmed && !isEnded
                      ? 'border-gray-200 hover:border-[#F84464]/50'
                      : 'border-gray-200 bg-gray-50/70 opacity-80'
                  }`}
                >
                  {/* Card Header Banner */}
                  <div className="p-5 flex gap-4 items-start border-b border-gray-100 bg-gray-50/50">
                    <img
                      src={item.moviePoster}
                      alt={item.movieTitle}
                      className="w-16 h-22 object-cover rounded-xl border border-gray-200 flex-shrink-0 shadow-xs"
                    />

                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isEvent
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-[#F84464] border-red-100'
                          }`}>
                            {isEvent ? 'Event Pass' : 'Movie Ticket'}
                          </span>
                          {isBlockchain && (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Web3
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          !isConfirmed
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isEnded
                            ? 'bg-gray-100 text-gray-700 border border-gray-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {!isConfirmed ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" /> Cancelled
                            </>
                          ) : isEnded ? (
                            <>
                              <Clock className="w-3 h-3 text-gray-500" /> Show Ended
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-[#1A1D24] line-clamp-1">{item.movieTitle}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#F84464]" />
                        <span>{item.date} @ {item.time}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Venue / Theatre</span>
                        <span className="font-bold text-[#1A1D24] truncate block">{item.theatreName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">
                          {isEvent ? 'Pass Tier & Qty' : 'Seats Reserved'}
                        </span>
                        <span className={`font-extrabold ${isConfirmed ? 'text-[#F84464]' : 'line-through text-gray-400'}`}>
                          {isEvent && item.ticketTierName
                            ? `${item.ticketTierName} Tier (${item.quantity || 1} Pass${(item.quantity || 1) > 1 ? 'es' : ''})`
                            : item.seats.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Ticket Code</span>
                        <span className="font-mono text-gray-900 font-bold">{item.bookingCode}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Payment Method</span>
                        <span className="font-bold text-[#1A1D24] block truncate">
                          {item.paymentMethodName || (isBlockchain ? 'Web3 Crypto Wallet' : 'Standard Payment')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Price</span>
                        <span className={`font-black ${isConfirmed ? 'text-[#1A1D24]' : 'text-rose-600'}`}>
                          {isBlockchain
                            ? (isConfirmed ? '0.01 ETH' : '0.01 ETH Refunded')
                            : `${item.currencySymbol || '$'}${item.totalPrice.toFixed(2)}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Booking Status</span>
                        <span className={`font-extrabold ${
                          !isConfirmed ? 'text-rose-600' : isEnded ? 'text-gray-600' : 'text-emerald-600'
                        }`}>
                          {!isConfirmed ? 'Cancelled' : isEnded ? 'Completed (History)' : 'Active Confirmed'}
                        </span>
                      </div>

                      {/* Connected Wallet Address for Web3 Payments */}
                      {item.payerAddress && (
                        <div className="col-span-2 pt-1 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Wallet Address</span>
                          <span className="font-mono text-[11px] font-bold text-gray-800 truncate block">
                            {item.payerAddress}
                          </span>
                        </div>
                      )}

                      <div className="col-span-2 pt-1">
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Booking Timestamp</span>
                        <span className="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#F84464]" />
                          <span>{item.bookedAt ? formatBookingTime(item.bookedAt) : 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Blockchain Hash Links */}
                    {item.txHash && (
                      <div className="pt-2 border-t border-gray-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 uppercase">
                          <Lock className="w-3 h-3 text-emerald-600" /> 0.01 ETH Booking Tx Hash:
                        </span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-blue-600 hover:text-blue-800 underline truncate block"
                        >
                          {item.txHash}
                        </a>
                      </div>
                    )}

                    {item.refundTxHash && (
                      <div className="pt-1 border-t border-rose-100 space-y-1">
                        <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1 uppercase">
                          <RefreshCw className="w-3 h-3 text-rose-600" /> 0.01 ETH Refund Tx Hash:
                        </span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${item.refundTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-rose-600 hover:text-rose-800 underline truncate block"
                        >
                          {item.refundTxHash}
                        </a>
                      </div>
                    )}

                    {/* Actions: View Ticket & Cancel Booking */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedTicketModal(item)}
                        className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-[#F84464] text-gray-800 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ticket</span>
                      </button>

                      {isConfirmed && !isEnded ? (
                        <button
                          onClick={() => {
                            setTicketToCancel(item);
                            setCancelError(null);
                          }}
                          className="py-2.5 px-4 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isBlockchain ? 'Cancel & Refund 0.01 ETH' : 'Cancel Booking'}</span>
                        </button>
                      ) : (
                        <div className="py-2.5 px-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1">
                          {isConfirmed ? (
                            <>
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span>Show Completed</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{isBlockchain ? '0.01 ETH Refunded' : 'Cancelled'}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLEAR HISTORY CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#1A1D24]">Clear Booking History?</h3>
                <p className="text-xs text-gray-500">This action will remove all saved ticket records.</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-gray-700 space-y-2">
              <p className="font-bold text-rose-900">Are you sure you want to clear your booking history?</p>
              <p className="text-gray-600">
                This will remove all {bookings.length} stored booking record(s) from your account history and browser storage.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all"
              >
                Keep History
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirmModal(false);
                  setClearNotification(true);
                  setTimeout(() => setClearNotification(false), 5000);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Clear History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION & REFUND CONFIRMATION MODAL */}
      {ticketToCancel && (() => {
        const isBlockchainToCancel = isBlockchainBooking(ticketToCancel);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
            <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header - Pinned Top */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 flex-shrink-0 bg-white z-10">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-lg text-[#1A1D24] leading-snug truncate">
                    {isBlockchainToCancel ? 'Cancel Ticket & Refund ETH?' : 'Cancel Booking?'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {isBlockchainToCancel 
                      ? 'Executes 0.01 ETH Sepolia Smart Contract Refund' 
                      : 'Standard Off-Chain Booking Cancellation'}
                  </p>
                </div>
                <button
                  onClick={() => setTicketToCancel(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-900 font-extrabold text-lg transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - Internal Scrollable Area */}
              <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">
                {/* Error Banner if any */}
                {cancelError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{cancelError}</span>
                    </div>
                    {isBlockchainToCancel && (!walletState?.connected || !walletState?.address) && onOpenWalletModal && (
                      <button
                        onClick={onOpenWalletModal}
                        className="w-full mt-1 py-2 bg-[#F84464] text-white rounded-xl font-bold text-xs"
                      >
                        Connect MetaMask Wallet
                      </button>
                    )}
                  </div>
                )}

                {/* Ticket Preview Card */}
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded-md">
                      {ticketToCancel.bookingCode}
                    </span>
                    <span className="text-xs font-black text-[#F84464]">
                      {isBlockchainToCancel
                        ? 'Refund: 0.01 ETH'
                        : `Refund: ${ticketToCancel.currencySymbol || '$'}${ticketToCancel.totalPrice.toFixed(2)}`}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A1D24]">{ticketToCancel.movieTitle}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{ticketToCancel.theatreName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ticketToCancel.date} @ {ticketToCancel.time}</p>
                  </div>

                  <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">Reserved Seats:</span>
                    <span className="font-extrabold text-[#F84464]">{ticketToCancel.seats.join(', ')}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  {isBlockchainToCancel ? (
                    <>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Smart contract executes refund of exactly 0.01 ETH to original payer.</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Confirmed on Sepolia blockchain before booking is cancelled locally.</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Standard booking cancellation process.</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>No blockchain transaction or wallet connection required.</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Buttons - Pinned Footer */}
              <div className="p-4 sm:px-6 border-t border-gray-100 flex-shrink-0 bg-white z-10 flex items-center gap-3">
                <button
                  onClick={() => setTicketToCancel(null)}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {isBlockchainToCancel ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Confirm & Refund 0.01 ETH</span>
                        </>
                      ) : (
                        <span>Confirm Cancellation</span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW TICKET MODAL */}
      {selectedTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
          <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header - Fixed & Pinned Top */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0 bg-white z-10">
              <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                selectedTicketModal.status === 'Confirmed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {selectedTicketModal.status} Digital Ticket
              </span>
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-900 font-extrabold text-lg transition-colors flex-shrink-0"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Internal Scrollable Area */}
            <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">
              {/* Pass Visual */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 text-center">
                <img
                  src={selectedTicketModal.moviePoster}
                  alt={selectedTicketModal.movieTitle}
                  className="w-24 h-32 object-cover rounded-xl mx-auto shadow-md border border-gray-200"
                />

                <div>
                  <h3 className="font-black text-lg text-[#1A1D24]">{selectedTicketModal.movieTitle}</h3>
                  <p className="text-xs text-[#F84464] font-bold mt-0.5">{selectedTicketModal.theatreName}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-xl text-xs space-y-1.5 text-gray-700 text-left">
                  <p><strong>Date & Time:</strong> {selectedTicketModal.date} @ {selectedTicketModal.time}</p>
                  <p><strong>Venue:</strong> {selectedTicketModal.theatreName}</p>
                  {selectedTicketModal.ticketTierName && (
                    <p><strong>Ticket Tier:</strong> <span className="font-extrabold text-blue-700">{selectedTicketModal.ticketTierName}</span> (Qty: {selectedTicketModal.quantity || 1})</p>
                  )}
                  <p><strong>Ticket / Pass Details:</strong> <span className="text-[#F84464] font-bold">{selectedTicketModal.seats.join(', ')}</span></p>
                  <p><strong>Ticket ID:</strong> {selectedTicketModal.id}</p>
                  <p>
                    <strong>Payment Method:</strong>{' '}
                    <span className="font-bold">{selectedTicketModal.paymentMethodName || (isBlockchainBooking(selectedTicketModal) ? 'Web3 Crypto Wallet (0.01 ETH)' : 'Standard Payment')}</span>
                  </p>
                  <p>
                    <strong>Displayed Price:</strong>{' '}
                    <span className="font-black text-[#1A1D24]">
                      {isBlockchainBooking(selectedTicketModal) 
                        ? '0.01 ETH (Sepolia Testnet)' 
                        : `${selectedTicketModal.currencySymbol || '$'}${selectedTicketModal.totalPrice.toFixed(2)}`}
                    </span>
                  </p>
                  {selectedTicketModal.payerAddress && (
                    <p className="font-mono text-[11px] truncate">
                      <strong>Wallet Address:</strong> {selectedTicketModal.payerAddress}
                    </p>
                  )}
                  {selectedTicketModal.bookedAt && (
                    <p className="flex items-center gap-1.5 text-[#F84464] font-bold pt-1.5 border-t border-gray-100">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatBookingTime(selectedTicketModal.bookedAt)}</span>
                    </p>
                  )}
                </div>

                {/* Blockchain Hashes in Modal */}
                {selectedTicketModal.txHash && (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Payment Transaction Hash</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${selectedTicketModal.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 underline break-all block"
                    >
                      {selectedTicketModal.txHash}
                    </a>
                  </div>
                )}

                {selectedTicketModal.refundTxHash && (
                  <div className="p-3 bg-white border border-rose-200 rounded-xl text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-600 block">Refund Transaction Hash</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${selectedTicketModal.refundTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-rose-600 hover:text-rose-800 underline break-all block"
                    >
                      {selectedTicketModal.refundTxHash}
                    </a>
                  </div>
                )}

                <div className="p-4 bg-white rounded-2xl border border-gray-200 w-fit mx-auto shadow-sm">
                  <img src={selectedTicketModal.qrCodeUrl} alt="Ticket QR" className="w-32 h-32 mx-auto" />
                  <span className="text-[10px] font-mono text-gray-900 font-extrabold block mt-2">
                    {selectedTicketModal.bookingCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer - Fixed & Pinned Bottom */}
            <div className="p-4 sm:px-6 border-t border-gray-100 flex-shrink-0 bg-white z-10">
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="w-full py-3 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
