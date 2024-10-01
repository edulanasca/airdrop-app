'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ethers } from 'ethers';
import { truncateAddress } from '@/utils/walletUtils';

// Create a context for the wallet
const WalletContext = createContext<{
  account: string | null;
  provider: ethers.BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isCorrectAccount: boolean;
}>({
  account: null,
  provider: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isCorrectAccount: false,
});

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Wallet provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isCorrectAccount, setIsCorrectAccount] = useState(true);

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);

        // Check if already connected
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
          }
        });
      }
    };

    initProvider();

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    const checkAccount = async () => {
      if (typeof window.ethereum !== 'undefined' && account) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsCorrectAccount(accounts[0]?.toLowerCase() === account.toLowerCase());
      }
    };

    checkAccount();
  }, [account]);

  const connectWallet = async () => {
    if (!provider) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      setAccount(address);
      setIsCorrectAccount(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <WalletContext.Provider value={{ account, provider, connectWallet, disconnectWallet, isCorrectAccount }}>
      {children}
    </WalletContext.Provider>
  );
};

// WalletConnect component (optional, can be used to display connection status and buttons)
const WalletConnect: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isCorrectAccount } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {account ? (
        <>
          {!isCorrectAccount && (
            <p className="text-red-500 mb-2">Warning: Connected account doesn&apos;t match the selected account in MetaMask.</p>
          )}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-300 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6h2v2H9V8zm8.758 8H2.242c-.956 0-1.331-1.172-.536-1.75L6 11.414V4h8v7.414l4.294 2.836c.795.578.42 1.75-.536 1.75z" clipRule="evenodd" />
            </svg>
            {truncateAddress(account)}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out"
              >
                Disconnect
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-300 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;