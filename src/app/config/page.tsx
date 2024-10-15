'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletConnect';
import { useMerkleAirdrop } from '@/hooks/useMerkleAirdrop';
import Header from '@/components/Header';
import { toast, ToastContainer } from 'react-toastify';
import { ethers } from 'ethers';

const ConfigPage = () => {
  const { account } = useWallet();
  const { contract, adminList, addAdmin, togglePause } = useMerkleAirdrop();
  const [isPaused, setIsPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newAdminAddress, setNewAdminAddress] = useState('');

  useEffect(() => {
    const checkAdminAndPauseStatus = async () => {
      if (contract && account) {
        setIsAdmin(adminList.includes(account.toLowerCase()));
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

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("You don't have admin privileges to perform this action.");
      return;
    }

    if (!ethers.isAddress(newAdminAddress)) {
      toast.error("Invalid Ethereum address");
      return;
    }

    try {
      const success = await addAdmin(newAdminAddress);
      if (success) {
        toast.success(`New admin ${newAdminAddress} added successfully`);
        setNewAdminAddress('');
      } else {
        toast.error('Failed to add new admin');
      }
    } catch (error) {
      console.error('Error adding new admin:', error);
      toast.error('An error occurred while adding new admin');
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
              } transition-colors duration-300 mb-6`}
            >
              {isPaused ? 'Unpause Contract' : 'Pause Contract'}
            </button>

            <h3 className="text-lg font-semibold mb-2">Add New Admin</h3>
            <form onSubmit={handleAddAdmin} className="flex flex-col space-y-4">
              <input
                type="text"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                placeholder="Enter new admin address"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
              >
                Add Admin
              </button>
            </form>
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
