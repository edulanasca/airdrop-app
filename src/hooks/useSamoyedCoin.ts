import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import SamoyedCoinABI from '../abi/SamoyedCoin.json';
import adminsList from '../../admins.json';
import { toast } from 'react-toastify';

const SAMOYEDCOIN_ADDRESS = process.env.NEXT_PUBLIC_SAMOYEDCOIN_ADDRESS!;

export const useSamoyedCoin = () => {
    const { account, provider } = useWallet();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [balance, setBalance] = useState<bigint>(BigInt(0));
    const [adminList, setAdminList] = useState<string[]>([]);

    const updateBalance = useCallback(async () => {
        if (contract && account) {
            const balance = await contract.balanceOf(account);
            setBalance(balance);
        }
    }, [contract, account]);

    const updateAdminList = useCallback(async () => {
        if (contract) {
            try {
                // Start with the addresses from admins.json
                const addressSet = new Set<string>(adminsList);

                // Get AdminStatusChanged events since the last block we checked
                const lastCheckedBlock = localStorage.getItem('lastCheckedAdminBlock') || '0';
                const filter = contract.filters.AdminStatusChanged();
                const events = await contract.queryFilter(filter, parseInt(lastCheckedBlock));

                // Add addresses from recent events
                events.forEach(event => {
                    // @ts-ignore
                    const [address] = event.args!;
                    addressSet.add(address);
                });

                // Update the last checked block
                if (events.length > 0) {
                    const latestBlock = events[events.length - 1].blockNumber;
                    localStorage.setItem('lastCheckedAdminBlock', latestBlock.toString());
                }

                // Check current admin status for each address
                const adminPromises = Array.from(addressSet).map(async (address) => {
                    const isAdmin = await contract.admins(address);
                    return isAdmin ? address : null;
                });

                const admins = await Promise.all(adminPromises);
                setAdminList(admins.filter((admin): admin is string => admin !== null));
            } catch (error) {
                console.error('Error updating admin list:', error);
            }
        }
    }, [contract]);

    useEffect(() => {
        if (contract && account) {
            updateAdminList().catch(err => console.error(err));
            updateBalance().catch(err => console.error(err));
        }
    }, [contract, account, updateAdminList, updateBalance]);

    useEffect(() => {
        const initContract = async () => {
            if (provider && SAMOYEDCOIN_ADDRESS) {
                try {
                    const signer = await provider.getSigner();
                    const samoyedCoin = new ethers.Contract(SAMOYEDCOIN_ADDRESS, SamoyedCoinABI.abi, signer);
                    setContract(samoyedCoin);
                } catch (error: any) {
                    toast.error('Error initializing SamoyedCoin contract: ');
                }
            }
        };

        initContract();
    }, [provider]);

    const mint = useCallback(async (to: string, amount: bigint) => {
        if (contract) {
            try {
                const tx = await contract.mint(to, amount);
                await tx.wait();
                await updateBalance();
                return true;
            } catch (error) {
                console.error('Error minting tokens:', error);
                return false;
            }
        }
        return false;
    }, [contract, updateBalance]);

    const setAdmin = useCallback(async (admin: string, isAdmin: boolean) => {
        if (contract) {
            try {
                const tx = await contract.setAdmin(admin, isAdmin);
                await tx.wait();
                await updateAdminList();
                return true;
            } catch (error) {
                console.error('Error setting admin status:', error);
                return false;
            }
        }
        return false;
    }, [contract, updateAdminList]);

    const togglePause = useCallback(async () => {
        if (contract) {
            try {
                const isPaused = await contract.paused();
                const tx = isPaused ? await contract.unpause() : await contract.pause();
                await tx.wait();
                return true;
            } catch (error) {
                console.error('Error toggling pause state:', error);
                return false;
            }
        }
        return false;
    }, [contract]);

    return {
        contract,
        balance,
        updateBalance,
        mint,
        adminList,
        setAdmin,
        togglePause,
    };
};