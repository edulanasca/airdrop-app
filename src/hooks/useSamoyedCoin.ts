import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import { SamoyedCoin } from '../abi/Samoyedcoin';
import { toast } from 'react-toastify';

const SAMOYEDCOIN_ADDRESS = process.env.NEXT_PUBLIC_SAMOYEDCOIN_ADDRESS!;

export const useSamoyedCoin = () => {
    const { account, provider } = useWallet();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [balance, setBalance] = useState<bigint>(BigInt(0));

    const updateBalance = useCallback(async () => {
        if (contract && account) {
            const balance = await contract.balanceOf(account);
            setBalance(balance);
        }
    }, [contract, account]);

    useEffect(() => {
        if (contract && account) {
            updateBalance().catch(err => console.error(err));
        }
    }, [contract, account, updateBalance]);

    useEffect(() => {
        const initContract = async () => {
            if (provider && SAMOYEDCOIN_ADDRESS) {
                try {
                    const signer = await provider.getSigner();
                    const samoyedCoin = new ethers.Contract(SAMOYEDCOIN_ADDRESS, SamoyedCoin.abi, signer);
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

    return {
        contract,
        balance,
        updateBalance,
        mint,
    };
};