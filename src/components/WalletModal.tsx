import React, { useState, useEffect } from 'react';
import {
  X, Wallet, ShieldCheck, Sparkles, Copy, Check, AlertTriangle,
  RefreshCw, ExternalLink, LogOut, Unlink, ShieldAlert
} from 'lucide-react';
import { WalletState } from '../types';
import {
  connectMetaMask,
  switchToSepoliaNetwork,
  checkIsSepoliaNetwork,
  formatEthBalance,
  revokeMetaMaskPermissions
} from '../utils/web3Service';
import { SEPOLIA_CHAIN_ID_DECIMAL } from '../config/contractConfig';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletState: WalletState;
  onConnectWallet: (address: string, balance?: number, chainId?: number) => void;
  onDisconnectWallet: () => void;
  onRefreshBalance?: () => Promise<void> | void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  onRefreshBalance
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSepolia, setIsSepolia] = useState<boolean>(true);
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setShowDisconnectModal(false);
      setIsRevoking(false);
      checkNetwork();
      if (walletState.connected && onRefreshBalance) {
        onRefreshBalance();
      }
    }
  }, [isOpen, walletState.connected]);

  const checkNetwork = async () => {
    if (walletState.connected) {
      const sepolia = await checkIsSepoliaNetwork();
      setIsSepolia(sepolia);
    }
  };

  if (!isOpen) return null;

  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    // Attempts silent reconnect if permissions exist, or triggers MetaMask prompt if revoked/new
    const result = await connectMetaMask();
    setIsConnecting(false);

    if (result.connected && result.address) {
      onConnectWallet(result.address, result.balance, result.chainId || undefined);
      setIsSepolia(result.isSepolia);
      if (!result.isSepolia) {
        setErrorMessage(result.error || 'Connected, but network is not Sepolia Testnet.');
      }
    } else {
      setErrorMessage(result.error || 'Failed to connect MetaMask wallet.');
    }
  };

  const handleSwitchNetwork = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    const success = await switchToSepoliaNetwork();
    setIsConnecting(false);
    if (success) {
      setIsSepolia(true);
      if (walletState.address) {
        onConnectWallet(walletState.address, walletState.balance, SEPOLIA_CHAIN_ID_DECIMAL);
        if (onRefreshBalance) await onRefreshBalance();
      }
    } else {
      setErrorMessage('Failed to switch network to Sepolia. Please switch manually in MetaMask.');
    }
  };

  const handleCopy = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Option A: Disconnect from BlockTix (Session Disconnect)
  const handleSessionDisconnect = () => {
    setShowDisconnectModal(false);
    onDisconnectWallet();
    onClose();
  };

  // Option B: Disconnect from MetaMask (Permission Revocation)
  const handleFullRevokeDisconnect = async () => {
    setIsRevoking(true);
    await revokeMetaMaskPermissions();
    setIsRevoking(false);
    setShowDisconnectModal(false);
    onDisconnectWallet();
    onClose();
  };

  // Option C: Cancel
  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header - Pinned Top */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:px-8 sm:py-5 flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#F84464] border border-red-100 flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#1A1D24] text-lg leading-snug truncate">
                {showDisconnectModal
                  ? 'Disconnect Options'
                  : walletState.connected
                    ? 'Web3 Wallet Connected'
                    : 'Connect MetaMask Wallet'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {showDisconnectModal
                  ? 'Select your preferred disconnection workflow'
                  : walletState.connected
                    ? 'Live Sepolia Blockchain Vault'
                    : 'Connect for 0.01 ETH Sepolia Payments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Internal Scrollable Area */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 overflow-y-auto flex-1 min-h-0 space-y-5 custom-scrollbar">

          {/* Error Banner */}
          {errorMessage && !showDisconnectModal && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {!isSepolia && walletState.connected && (
                <button
                  onClick={handleSwitchNetwork}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Switch to Sepolia Network (Chain ID: 11155111)</span>
                </button>
              )}
            </div>
          )}

          {/* Content Views */}
          {showDisconnectModal ? (
            /* Disconnect Confirmation Sub-View / Modal */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Please choose how you would like to disconnect your wallet:</span>
              </div>

              {/* Option A: Disconnect from BlockTix (Session Only) */}
              <button
                onClick={handleSessionDisconnect}
                disabled={isRevoking}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all space-y-2 group disabled:opacity-50 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-[#F84464] group-hover:text-white transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-xs text-[#1A1D24] group-hover:text-[#F84464] transition-colors">
                      Disconnect from BlockTix
                    </h4>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Session Only
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed pl-7">
                  Clears current website session state without revoking MetaMask permissions. Reconnecting will instantly restore access without a MetaMask pop-up prompt.
                </p>
              </button>

              {/* Option B: Disconnect from MetaMask (Permission Revocation) */}
              <button
                onClick={handleFullRevokeDisconnect}
                disabled={isRevoking}
                className="w-full text-left p-4 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 hover:border-rose-300 rounded-2xl transition-all space-y-2 group disabled:opacity-50 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-200 text-rose-800">
                      <Unlink className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-xs text-rose-950 group-hover:text-rose-700 transition-colors">
                      Disconnect from MetaMask
                    </h4>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Full Revoke
                  </span>
                </div>
                <p className="text-[11px] text-rose-900/80 leading-relaxed pl-7">
                  Uses official MetaMask permission revocation to completely remove BlockTix's access. The next connection will require full MetaMask pop-up approval.
                </p>
              </button>

              {/* Option C: Cancel */}
              <div className="pt-2">
                <button
                  onClick={handleCancelDisconnect}
                  disabled={isRevoking}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-extrabold text-xs transition-all disabled:opacity-50"
                >
                  Cancel (Keep Connected)
                </button>
              </div>
            </div>
          ) : walletState.connected ? (
            /* Connected State */
            <div className="space-y-5">
              {/* Connected Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  {isSepolia ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sepolia Testnet (Chain ID: 11155111)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      Wrong Network (Requires Sepolia)
                    </span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${isSepolia
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                    {isSepolia ? 'Active' : 'Switch Needed'}
                  </span>
                </div>

                {/* Address display */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 font-mono text-xs text-gray-800">
                  <span className="truncate max-w-[240px]">{walletState.address}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Balance & NFT stats with 3 decimal precision formatting */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sepolia ETH Balance</span>
                    <span className="text-sm font-extrabold text-[#1A1D24]">
                      {formatEthBalance(walletState.balance)} ETH
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Digital Passes</span>
                    <span className="text-sm font-extrabold text-[#F84464] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 0.01 ETH / Ticket
                    </span>
                  </div>
                </div>
              </div>

              {!isSepolia && (
                <button
                  onClick={handleSwitchNetwork}
                  className="w-full py-3 bg-[#F84464] hover:bg-[#E03352] text-white rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Switch to Sepolia Network</span>
                </button>
              )}

              {/* Benefit reassurance */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>Real 0.01 ETH Sepolia blockchain payments & instant contract-verified refunds.</span>
              </div>

              {/* Disconnect CTA */}
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          ) : (
            /* Disconnected View */
            <div className="space-y-4">
              {isConnecting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-red-200 border-t-[#F84464] animate-spin" />
                  <p className="text-xs font-bold text-[#F84464] animate-pulse">
                    Connecting to MetaMask Extension...
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    <button
                      onClick={handleConnectMetaMask}
                      className="w-full flex items-center justify-between p-4 bg-red-50/60 hover:bg-red-100/70 border border-[#F84464]/40 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🦊</span>
                        <div className="text-left">
                          <h4 className="text-xs font-black text-[#1A1D24] group-hover:text-[#F84464] flex items-center gap-1.5">
                            MetaMask Wallet
                            <span className="text-[9px] bg-[#F84464] text-white px-1.5 py-0.2 rounded font-extrabold">RECOMMENDED</span>
                          </h4>
                          <p className="text-[10px] text-gray-600 font-medium">Connect Sepolia testnet wallet for 0.01 ETH payments</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#F84464]" />
                    </button>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] text-gray-500 space-y-1">
                      <p className="font-bold text-gray-700">Sepolia Network Requirement:</p>
                      <p>Requires Sepolia Testnet (Chain ID: 11155111). Payments are strictly 0.01 ETH on live blockchain.</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-gray-400 pt-2">
                    By connecting, you agree to BlockTix Terms & Smart Contract Security Guidelines.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
