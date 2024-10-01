'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletConnect';
import { useSamoyedCoin } from '@/hooks/useSamoyedCoin';
import Header from '@/components/Header';
import { toast, ToastContainer } from 'react-toastify';

const ConfigPage = () => {
  const { account } = useWallet();
  const { contract, adminList, togglePause } = useSamoyedCoin();
  const [isPaused, setIsPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndPauseStatus = async () => {
      if (contract && account) {
        setIsAdmin(adminList.includes(account));
        const paused = await contract.paused();
        setIsPaused(paused);
      }
    };

    checkAdminAndPauseStatus();
  }, [contract, account, adminList]);

  const handleTogglePause = async () => {
    if (!isAdmin) {
      toast.error("You don't have admin privileges to perform this action.");
      return;
    }

    try {
      const success = await togglePause();
      if (success) {
        setIsPaused(!isPaused);
        toast.success(`Contract ${isPaused ? 'unpaused' : 'paused'} successfully`);
      } else {
        toast.error('Failed to toggle pause state');
      }
    } catch (error) {
      console.error('Error toggling pause state:', error);
      toast.error('An error occurred while toggling pause state');
    }
  };

  return (
    <div className='min-h-screen'>
      <Header />
      <main className="max-w-4xl mx-auto mt-8 p-4 text-black">
        <h1 className="text-3xl font-bold mb-6">Contract Configuration</h1>
        {isAdmin ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
            <p className="mb-4">Current contract state: {isPaused ? 'Paused' : 'Active'}</p>
            <button
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isPaused
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } transition-colors duration-300`}
            >
              {isPaused ? 'Unpause Contract' : 'Pause Contract'}
            </button>
          </div>
        ) : (
          <p className="text-xl">You do not have admin privileges to access this page.</p>
        )}
        <ToastContainer position="bottom-right" />
      </main>
    </div>
  );
};

export default ConfigPage;