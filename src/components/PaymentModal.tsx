import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Ticket, CreditCard, Wallet, Sparkles, ExternalLink, AlertTriangle, RefreshCw, Lock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Movie, Theatre, Showtime, BookingTicket, WalletState } from '../types';
import { getCurrencyForLocation, formatPrice } from '../data/mockData';
import { executeBookingPaymentOnChain, checkIsSepoliaNetwork, connectMetaMask, switchToSepoliaNetwork, isMetaMaskInstalled, formatEthBalance } from '../utils/web3Service';
import { FIXED_TICKET_PRICE_ETH, SEPOLIA_CHAIN_ID_DECIMAL } from '../config/contractConfig';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie;
  selectedDate: string;
  theatre: Theatre;
  showtime: Showtime;
  selectedSeats: string[];
  selectedLocation: string;
  walletState?: WalletState;
  onOpenWalletModal?: () => void;
  onConnectWallet?: (address: string, balance?: number, chainId?: number) => void;
  onConfirmBooking: (ticket: BookingTicket) => void;
  onNavigateToBookings?: () => void;
  onRefreshBalance?: () => Promise<void> | void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  movie,
  selectedDate,
  theatre,
  showtime,
  selectedSeats,
  selectedLocation,
  walletState,
  onOpenWalletModal,
  onConnectWallet,
  onConfirmBooking,
  onNavigateToBookings,
  onRefreshBalance
}) => {
  const currencyConfig = getCurrencyForLocation(selectedLocation);
  const [paymentMethodId, setPaymentMethodId] = useState<string>(currencyConfig.paymentMethods[0]?.id || 'card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<BookingTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusStepMessage, setStatusStepMessage] = useState<string>('');

  const isEthereumPayment = paymentMethodId === 'crypto' || paymentMethodId === 'ethereum' || paymentMethodId === 'web3';

  // Reset modal state whenever opened
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsConnectingWallet(false);
      setIsSuccess(false);
      setCreatedTicket(null);
      setErrorMessage(null);
      setStatusStepMessage('');
      setPaymentMethodId(currencyConfig.paymentMethods[0]?.id || 'card');
      if (walletState?.connected && onRefreshBalance) {
        onRefreshBalance();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ticketPriceUSD = showtime.basePriceUSD;
  const subtotalUSD = ticketPriceUSD * selectedSeats.length;
  const bookingFeeUSD = 2.50;
  const grandTotalUSD = subtotalUSD + bookingFeeUSD;

  // Direct Wallet Connection Logic bypassing intermediate selection modal
  const handleDirectConnectWallet = async () => {
    setErrorMessage(null);

    // Error Handling: Check if MetaMask is installed
    if (!isMetaMaskInstalled()) {
      setErrorMessage('MetaMask wallet extension is required for Web3 payment. Please install MetaMask.');
      return;
    }

    setIsConnectingWallet(true);

    const result = await connectMetaMask();
    setIsConnectingWallet(false);

    if (result.connected && result.address) {
      if (onConnectWallet) {
        onConnectWallet(result.address, result.balance, result.chainId || undefined);
      }
      if (onRefreshBalance) {
        await onRefreshBalance();
      }
      if (!result.isSepolia) {
        setErrorMessage(result.error || 'Connected, but network is not Sepolia Testnet.');
      }
    } else {
      setErrorMessage(result.error || 'Failed to connect MetaMask wallet.');
    }
  };

  const handlePayNow = async () => {
    setErrorMessage(null);

    // 1. Ethereum / MetaMask Payment Flow
    if (isEthereumPayment) {
      // Check if MetaMask is installed
      if (!isMetaMaskInstalled()) {
        setErrorMessage('MetaMask wallet extension is required for Web3 payment. Please install MetaMask.');
        return;
      }

      // Check if Wallet is connected
      if (!walletState?.connected || !walletState?.address) {
        await handleDirectConnectWallet();
        return;
      }

      // Network Validation Check for Sepolia Testnet (Chain ID: 11155111)
      const isSepolia = await checkIsSepoliaNetwork();
      if (!isSepolia) {
        setStatusStepMessage('Switching network to Sepolia Testnet (Chain ID: 11155111)...');
        const switched = await switchToSepoliaNetwork();
        if (!switched) {
          setErrorMessage('Network Validation Failed: Connected wallet must be on Sepolia Testnet (Chain ID: 11155111).');
          return;
        }
      }

      // Trigger Real Sepolia Smart Contract / MetaMask Payment Transaction (0.01 ETH)
      setIsProcessing(true);
      setStatusStepMessage('Please confirm the 0.01 ETH transaction in MetaMask...');

      const bookingCode = `BTX-${Math.floor(1000 + Math.random() * 9000)}-${currencyConfig.code}`;
      const txResult = await executeBookingPaymentOnChain(bookingCode);

      setIsProcessing(false);

      if (!txResult.success || !txResult.txHash) {
        setErrorMessage(txResult.error || 'Transaction failed or rejected in MetaMask.');
        return;
      }

      if (onRefreshBalance) {
        await onRefreshBalance();
      }

      const grandTotalConverted = grandTotalUSD * currencyConfig.rateFromUSD;
      const newTicket: BookingTicket = {
        id: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'movie',
        movieId: movie.id,
        theatreId: theatre.id,
        showtimeId: showtime.id,
        movieTitle: movie.title,
        moviePoster: movie.poster,
        date: selectedDate,
        time: showtime.time,
        theatreName: theatre.name,
        seats: selectedSeats,
        totalPrice: grandTotalConverted,
        currencySymbol: currencyConfig.symbol,
        currencyCode: currencyConfig.code,
        bookingCode: bookingCode,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingCode}`,
        status: 'Confirmed',
        bookedAt: new Date().toISOString(),
        txHash: txResult.txHash,
        payerAddress: walletState.address,
        paymentType: 'blockchain',
        paymentMethodName: 'Web3 Crypto Wallet (0.01 ETH)'
      };

      setCreatedTicket(newTicket);
      setIsSuccess(true);
      onConfirmBooking(newTicket);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    } else {
      // 2. Standard Off-Chain Payment Flow (Card, Apple Pay, UPI, NetBanking)
      setIsProcessing(true);
      setStatusStepMessage('Processing booking payment...');

      setTimeout(() => {
        setIsProcessing(false);
        const bookingCode = `BTX-${Math.floor(1000 + Math.random() * 9000)}-${currencyConfig.code}`;
        const grandTotalConverted = grandTotalUSD * currencyConfig.rateFromUSD;
        const selectedPm = currencyConfig.paymentMethods.find((pm) => pm.id === paymentMethodId);

        const newTicket: BookingTicket = {
          id: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
          type: 'movie',
          movieId: movie.id,
          theatreId: theatre.id,
          showtimeId: showtime.id,
          movieTitle: movie.title,
          moviePoster: movie.poster,
          date: selectedDate,
          time: showtime.time,
          theatreName: theatre.name,
          seats: selectedSeats,
          totalPrice: grandTotalConverted,
          currencySymbol: currencyConfig.symbol,
          currencyCode: currencyConfig.code,
          bookingCode: bookingCode,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingCode}`,
          status: 'Confirmed',
          bookedAt: new Date().toISOString(),
          paymentType: 'standard',
          paymentMethodName: selectedPm?.name || 'Credit / Debit Card'
        };

        setCreatedTicket(newTicket);
        setIsSuccess(true);
        onConfirmBooking(newTicket);

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (err) {}
      }, 600);
    }
  };

  const handleManualDone = () => {
    onClose();
    if (onNavigateToBookings) {
      onNavigateToBookings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header - Pinned Top */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:px-8 sm:py-5 flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#F84464] border border-red-100 flex-shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#1A1D24] text-lg leading-snug truncate">
                {isSuccess ? 'Booking Successful!' : 'Checkout & Payment'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {isSuccess 
                  ? (createdTicket?.paymentType === 'blockchain' ? 'Recorded on-chain on Sepolia Testnet' : 'Your booking has been confirmed')
                  : (isEthereumPayment ? 'Paying 0.01 ETH on Sepolia Testnet' : `Complete payment in ${currencyConfig.code}`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Internal Scrollable Area */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 overflow-y-auto flex-1 min-h-0 space-y-5 custom-scrollbar">
          
          {/* Error message (Shown for Ethereum payment issues or errors) */}
          {errorMessage && isEthereumPayment && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {(!walletState?.connected || !walletState?.address) && (
                <button
                  onClick={handleDirectConnectWallet}
                  disabled={isConnectingWallet}
                  className="w-full mt-1 py-2 bg-[#F84464] hover:bg-[#E03352] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isConnectingWallet ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Connecting MetaMask...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Connect MetaMask Wallet</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Content */}
          {isSuccess && createdTicket ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
                <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    {createdTicket.paymentType === 'blockchain' ? 'Smart Contract Booking Verified!' : 'Booking Confirmed!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Ticket #{createdTicket.id} confirmed successfully.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#F84464] block">Movie Ticket Pass</span>
                    <h4 className="font-extrabold text-base text-[#1A1D24]">{createdTicket.movieTitle}</h4>
                  </div>
                  <div className="px-2.5 py-1 bg-red-50 border border-red-100 rounded-full text-[10px] font-bold text-[#F84464]">
                    {showtime.format}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Date & Time</span>
                    <span className="font-bold text-[#1A1D24]">{createdTicket.date} | {createdTicket.time}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Seats ({createdTicket.seats.length})</span>
                    <span className="font-extrabold text-[#F84464]">{createdTicket.seats.join(', ')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Theatre Venue</span>
                    <span className="font-bold text-[#1A1D24]">{createdTicket.theatreName}</span>
                  </div>
                </div>

                {/* Real Blockchain Tx Hash Display */}
                {createdTicket.txHash && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-600 block flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Live Blockchain Transaction Hash
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${createdTicket.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 underline break-all flex items-center gap-1"
                    >
                      <span>{createdTicket.txHash}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 pt-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Pass Code</span>
                    <span className="font-mono text-sm font-bold text-gray-900">{createdTicket.bookingCode}</span>
                  </div>
                  <img src={createdTicket.qrCodeUrl} alt="QR Code" className="w-14 h-14 bg-white p-1 rounded-lg border border-gray-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Ticket Summary Box */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-[#1A1D24] pb-2 border-b border-gray-200">
                  <span className="text-[#F84464] font-extrabold">{movie.title}</span>
                  <span className="text-gray-600 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{showtime.format}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Date & Showtime</span>
                  <span className="font-bold text-[#1A1D24]">{selectedDate} @ {showtime.time}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Theatre</span>
                  <span className="font-bold text-[#1A1D24] truncate max-w-[200px]">{theatre.name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Selected Seats ({selectedSeats.length})</span>
                  <span className="font-extrabold text-[#F84464]">{selectedSeats.join(', ')}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {currencyConfig.paymentMethods.map((pm) => {
                    const isSelected = paymentMethodId === pm.id;
                    const isCrypto = pm.id === 'crypto' || pm.id === 'ethereum' || pm.id === 'web3';

                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethodId(pm.id);
                          setErrorMessage(null);
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-red-50/70 border-[#F84464] text-[#1A1D24] shadow-2xs font-extrabold'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 font-semibold'
                        }`}
                      >
                        <span className="text-lg">{pm.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate block">{pm.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#F84464] flex-shrink-0" />}
                          </div>
                          {isCrypto && (
                            <span className="text-[9px] text-[#F84464] font-extrabold block">0.01 ETH Sepolia</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between text-gray-500">
                  <span>Tickets ({selectedSeats.length} x {formatPrice(ticketPriceUSD, selectedLocation)})</span>
                  <span className="font-bold text-gray-700">{formatPrice(subtotalUSD, selectedLocation)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Convenience Fee</span>
                  <span className="font-bold text-gray-700">{formatPrice(bookingFeeUSD, selectedLocation)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#1A1D24] pt-2 border-t border-gray-100">
                  <span>Total Amount ({currencyConfig.code})</span>
                  <span className="text-gray-900">{formatPrice(grandTotalUSD, selectedLocation)}</span>
                </div>

                {/* Highlight Banner ONLY when Ethereum Payment is explicitly selected */}
                {isEthereumPayment && (
                  <div className="flex justify-between items-center bg-red-50/70 p-2.5 rounded-xl border border-red-100 font-black">
                    <span className="text-xs text-[#F84464]">Fixed Blockchain Sepolia Payment</span>
                    <span className="text-sm text-[#F84464]">0.01 ETH</span>
                  </div>
                )}
              </div>

              {/* Wallet status banner ONLY shown when Ethereum payment is explicitly selected */}
              {isEthereumPayment && (
                !walletState?.connected ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                    <span className="font-medium">MetaMask wallet connection required for Ethereum payment.</span>
                    <button
                      type="button"
                      onClick={handleDirectConnectWallet}
                      disabled={isConnectingWallet}
                      className="px-3.5 py-1.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {isConnectingWallet ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Connect Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold block text-emerald-950">Connected: {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}</span>
                      <span className="text-[10px] text-emerald-700 block">Balance: {formatEthBalance(walletState.balance)} ETH (Sepolia Testnet)</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold">READY</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Pinned Footer Action CTA */}
        <div className="p-4 sm:px-8 sm:py-5 border-t border-gray-100 bg-white flex-shrink-0 z-10 shadow-xs">
          {isSuccess && createdTicket ? (
            <button
              onClick={handleManualDone}
              className="w-full py-3.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>View My Bookings</span>
            </button>
          ) : (
            <button
              onClick={handlePayNow}
              disabled={isProcessing || (isEthereumPayment && isConnectingWallet)}
              className="w-full py-3.5 bg-[#F84464] hover:bg-[#E03352] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>{statusStepMessage || 'Processing Transaction...'}</span>
                </>
              ) : isEthereumPayment ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Pay 0.01 ETH via MetaMask & Confirm</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay {formatPrice(grandTotalUSD, selectedLocation)} & Confirm</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
