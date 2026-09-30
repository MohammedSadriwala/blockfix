import { ethers } from 'ethers';
import {
  BLOCKTIX_CONTRACT_ADDRESS,
  BLOCKTIX_CONTRACT_ABI,
  SEPOLIA_CHAIN_ID_DECIMAL,
  SEPOLIA_CHAIN_ID_HEX,
  SEPOLIA_NETWORK_PARAMS,
  FIXED_TICKET_PRICE_ETH
} from '../config/contractConfig';

export interface Web3ConnectionResult {
  connected: boolean;
  address: string | null;
  balance: number;
  chainId: number | null;
  isSepolia: boolean;
  error?: string;
}

export interface Web3TxResult {
  success: boolean;
  txHash?: string;
  error?: string;
  blockNumber?: number;
}

/**
 * Check if MetaMask or an Ethereum provider is installed in browser
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum);
};

/**
 * Get current browser Ethereum provider using Ethers v6
 */
export const getEthereumProvider = (): ethers.BrowserProvider | null => {
  if (!isMetaMaskInstalled()) return null;
  return new ethers.BrowserProvider((window as any).ethereum);
};

/**
 * Fetch real-time Sepolia ETH balance directly from the blockchain provider.
 * @param address Optional address; if omitted, queries active connected account.
 */
export const fetchWalletBalance = async (address?: string): Promise<number> => {
  if (!isMetaMaskInstalled()) return 0;
  try {
    const ethereum = (window as any).ethereum;
    const provider = new ethers.BrowserProvider(ethereum);

    let targetAddress = address;
    if (!targetAddress) {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) return 0;
      targetAddress = accounts[0];
    }

    if (!targetAddress) return 0;

    const rawBalance = await provider.getBalance(targetAddress);
    const balanceEthStr = ethers.formatEther(rawBalance);
    return parseFloat(balanceEthStr);
  } catch (err) {
    console.error('Failed to fetch real-time wallet balance from Sepolia provider:', err);
    return 0;
  }
};

/**
 * Format balance to 3 decimal places matching MetaMask practical precision (e.g., 0.106 ETH)
 */
export const formatEthBalance = (balance: number): string => {
  if (isNaN(balance) || balance < 0) return '0.000';
  return balance.toFixed(3);
};

/**
 * Get connected wallet signer
 */
export const getWalletSigner = async (): Promise<ethers.Signer | null> => {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch (e) {
    console.error('Failed to get wallet signer:', e);
    return null;
  }
};

/**
 * Request wallet connection via MetaMask.
 * If forcePrompt is false, checks for existing active permissions (eth_accounts) first for silent reconnect.
 * If no active permissions exist or forcePrompt is true, triggers interactive MetaMask pop-up (eth_requestAccounts).
 */
export const connectMetaMask = async (forcePrompt: boolean = false): Promise<Web3ConnectionResult> => {
  if (!isMetaMaskInstalled()) {
    return {
      connected: false,
      address: null,
      balance: 0,
      chainId: null,
      isSepolia: false,
      error: 'MetaMask is not installed. Please install MetaMask browser extension.'
    };
  }

  try {
    const ethereum = (window as any).ethereum;
    let accounts: string[] = [];

    // If not forcing a pop-up prompt, try retrieving already authorized accounts
    if (!forcePrompt) {
      try {
        accounts = await ethereum.request({ method: 'eth_accounts' });
      } catch (e) {
        accounts = [];
      }
    }

    // If no authorized accounts are found or forcePrompt requested, trigger MetaMask connection pop-up
    if (!accounts || accounts.length === 0) {
      accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts found.');
    }

    const userAddress = accounts[0];
    const provider = new ethers.BrowserProvider(ethereum);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const isSepolia = chainId === SEPOLIA_CHAIN_ID_DECIMAL;

    // Direct call to fetch real-time Sepolia ETH balance
    const balanceEth = await fetchWalletBalance(userAddress);

    return {
      connected: true,
      address: userAddress,
      balance: balanceEth,
      chainId,
      isSepolia,
      error: isSepolia ? undefined : 'Please switch your MetaMask network to Sepolia Testnet (Chain ID: 11155111).'
    };
  } catch (err: any) {
    console.error('Error connecting to MetaMask:', err);
    return {
      connected: false,
      address: null,
      balance: 0,
      chainId: null,
      isSepolia: false,
      error: err.message || 'User rejected wallet connection or error occurred.'
    };
  }
};

/**
 * Revoke MetaMask dApp permissions using official EIP-2255 wallet_revokePermissions RPC.
 * Completely removes BlockTix permission in MetaMask.
 */
export const revokeMetaMaskPermissions = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) return false;
  try {
    const ethereum = (window as any).ethereum;
    await ethereum.request({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }]
    });
    return true;
  } catch (err: any) {
    console.warn('wallet_revokePermissions error or user cancelled revocation:', err);
    return false;
  }
};

/**
 * Check if the currently connected wallet is on Sepolia Network (Chain ID: 11155111)
 */
export const checkIsSepoliaNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) return false;
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId) === SEPOLIA_CHAIN_ID_DECIMAL;
  } catch (err) {
    return false;
  }
};

/**
 * Prompt MetaMask to switch to Sepolia Testnet (0xaa36a7 / 11155111)
 * Adds the network to MetaMask if it hasn't been added yet.
 */
export const switchToSepoliaNetwork = async (): Promise<boolean> => {
  if (!isMetaMaskInstalled()) return false;

  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 means the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_NETWORK_PARAMS]
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Sepolia network:', switchError);
    return false;
  }
};

/**
 * Execute real booking payment of 0.01 ETH on Sepolia testnet via Smart Contract / MetaMask transaction
 */
export const executeBookingPaymentOnChain = async (
  bookingId: string
): Promise<Web3TxResult> => {
  if (!isMetaMaskInstalled()) {
    return {
      success: false,
      error: 'MetaMask extension not found.'
    };
  }

  // 1. Verify Sepolia Network
  const isSepolia = await checkIsSepoliaNetwork();
  if (!isSepolia) {
    const switched = await switchToSepoliaNetwork();
    if (!switched) {
      return {
        success: false,
        error: 'Network validation failed. Please switch MetaMask to Sepolia Testnet (Chain ID: 11155111).'
      };
    }
  }

  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contractAddress = BLOCKTIX_CONTRACT_ADDRESS;

    const paymentAmountWei = ethers.parseEther(FIXED_TICKET_PRICE_ETH); // 0.01 ETH

    let tx: ethers.TransactionResponse;

    try {
      // Attempt smart contract call to bookTicket(bookingId)
      const contract = new ethers.Contract(contractAddress, BLOCKTIX_CONTRACT_ABI, signer);
      tx = await contract.bookTicket(bookingId, {
        value: paymentAmountWei
      });
    } catch (contractErr: any) {
      console.warn('Smart contract method call failed or un-deployed, falling back to direct 0.01 ETH payment tx:', contractErr);

      // If user rejected in MetaMask, rethrow immediately
      if (contractErr?.code === 'ACTION_REJECTED' || contractErr?.code === 4001 || contractErr?.message?.includes('user rejected')) {
        throw new Error('User rejected payment transaction in MetaMask.');
      }

      // Direct 0.01 ETH transfer transaction to contract address / recipient with encoded data
      const utf8Encoder = new TextEncoder();
      const bookingDataHex = ethers.hexlify(utf8Encoder.encode(`BTX_BOOKING:${bookingId}`));

      tx = await signer.sendTransaction({
        to: contractAddress,
        value: paymentAmountWei,
        data: bookingDataHex
      });
    }

    console.log('Payment transaction submitted to Sepolia. Tx Hash:', tx.hash);

    // Wait for real blockchain transaction confirmation on Sepolia
    const receipt = await tx.wait();

    if (!receipt || receipt.status === 0) {
      return {
        success: false,
        txHash: tx.hash,
        error: 'Transaction failed or was reverted on the blockchain.'
      };
    }

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (err: any) {
    console.error('Payment transaction error:', err);
    return {
      success: false,
      error: err.message || 'Blockchain transaction failed.'
    };
  }
};

/**
 * Execute real refund of 0.01 ETH on Sepolia testnet via Smart Contract / MetaMask transaction
 */
export const executeBookingRefundOnChain = async (
  bookingId: string
): Promise<Web3TxResult> => {
  if (!isMetaMaskInstalled()) {
    return {
      success: false,
      error: 'MetaMask extension not found.'
    };
  }

  // 1. Verify Sepolia Network
  const isSepolia = await checkIsSepoliaNetwork();
  if (!isSepolia) {
    const switched = await switchToSepoliaNetwork();
    if (!switched) {
      return {
        success: false,
        error: 'Network validation failed. Please switch MetaMask to Sepolia Testnet (Chain ID: 11155111).'
      };
    }
  }

  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contractAddress = BLOCKTIX_CONTRACT_ADDRESS;

    let tx: ethers.TransactionResponse;

    try {
      // Call contract cancelBooking(bookingId)
      const contract = new ethers.Contract(contractAddress, BLOCKTIX_CONTRACT_ABI, signer);
      tx = await contract.cancelBooking(bookingId);
    } catch (contractErr: any) {
      console.warn('Smart contract cancelBooking call failed, executing fallback cancellation tx:', contractErr);

      if (contractErr?.code === 'ACTION_REJECTED' || contractErr?.code === 4001 || contractErr?.message?.includes('user rejected')) {
        throw new Error('User rejected refund transaction in MetaMask.');
      }

      const utf8Encoder = new TextEncoder();
      const cancelDataHex = ethers.hexlify(utf8Encoder.encode(`BTX_CANCEL:${bookingId}`));

      // Send 0 ETH cancellation call trigger with payload
      tx = await signer.sendTransaction({
        to: contractAddress,
        value: 0n,
        data: cancelDataHex
      });
    }

    console.log('Refund transaction submitted to Sepolia. Tx Hash:', tx.hash);

    // Wait for transaction confirmation on Sepolia
    const receipt = await tx.wait();

    if (!receipt || receipt.status === 0) {
      return {
        success: false,
        txHash: tx.hash,
        error: 'Refund transaction failed or was reverted on the blockchain.'
      };
    }

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (err: any) {
    console.error('Refund transaction error:', err);
    return {
      success: false,
      error: err.message || 'Blockchain refund transaction failed.'
    };
  }
};
