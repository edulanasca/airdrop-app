import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import SamoyedCoinABI from '../abi/SamoyedCoin.json';

const SAMOYEDCOIN_ADDRESS = process.env.NEXT_PUBLIC_SAMOYEDCOIN_ADDRESS!;

export const useSamoyedCoin = () => {
    const { account } = useWallet();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [balance, setBalance] = useState<bigint>(BigInt(0));
    const [adminList, setAdminList] = useState<string[]>([]);

    useEffect(() => {
        const initContract = async () => {
            if (typeof window.ethereum !== 'undefined' && account) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const samoyedCoin = new ethers.Contract(SAMOYEDCOIN_ADDRESS, SamoyedCoinABI.abi, signer);
                setContract(samoyedCoin);
                updateBalance();
                await updateAdminList();
            }
        };

        initContract();
    }, [account]);

    const updateBalance = useCallback(async () => {
        if (contract && account) {
            const balance = await contract.balanceOf(account);
            setBalance(balance);
        }
    }, [contract, account]);

    const updateAdminList = useCallback(async () => {
        if (contract) {
            const filter = contract.filters.AdminStatusChanged();
            const events = await contract.queryFilter(filter);
            const adminSet = new Set<string>();

            for (const event of events) {
                const [admin, isAdmin] = event.args!;
                if (isAdmin) {
                    adminSet.add(admin);
                } else {
                    adminSet.delete(admin);
                }
            }

            setAdminList(Array.from(adminSet));
        }
    }, [contract]);

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

    return {
        balance,
        updateBalance,
        mint,
        adminList,
        setAdmin,
    };
};