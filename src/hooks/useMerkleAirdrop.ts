import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import MerkleAirdropABI from '../abi/MerkleAirdrop.json';
import usersList from '../../users.json';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { formatTokenAmount } from '@/utils/tokenUtils';

const MERKLE_AIRDROP_ADDRESS = process.env.NEXT_PUBLIC_MERKLE_AIRDROP_ADDRESS!;

export const useMerkleAirdrop = () => {
    const { account } = useWallet();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [claimedAmount, setClaimedAmount] = useState<string>("0");
    const users = useMemo(() => usersList.users, []);
    const tree = useMemo(() => StandardMerkleTree.of(usersList.users, ["address", "uint256"]), []);

    const updateClaimedAmount = useCallback(async () => {
        if (contract && account) {
            const claimed = await contract.claimedAmounts(account);
            setClaimedAmount(formatTokenAmount(claimed));
        }
    }, [contract, account]);

    useEffect(() => {
        const initContract = async () => {
            if (typeof window.ethereum !== 'undefined' && account) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const merkleAirdrop = new ethers.Contract(MERKLE_AIRDROP_ADDRESS, MerkleAirdropABI.abi, signer);
                setContract(merkleAirdrop);
                await updateClaimedAmount();
            }
        };

        initContract();
    }, [account, updateClaimedAmount]);

    const findUser = (address: string): { ix: number, data: string[] } | null => {
        let ix = users.findIndex(add => add[0] == address);
        return ix !== -1 ? { ix, data: users[ix] } : null;
    }    

    const verifyEligibility = useCallback(async (proof: string[], totalAssigned: bigint) => {
        if (contract && account) {
            return await contract.verify(proof, account, totalAssigned);
        }
        return false;
    }, [contract, account]);

    const claimTokens = useCallback(async (totalAssigned: bigint, amountToMint: bigint, proof: string[]) => {
        if (contract && account) {
            try {
                const tx = await contract.claimTokens(totalAssigned, amountToMint, proof);
                await tx.wait();
                await updateClaimedAmount();
                return true;
            } catch (error: any) {
                // Log the original error
                console.error('Error claiming tokens:', error);
                return false;
            }
        }
        return false;
    }, [contract, account, updateClaimedAmount]);

    return {
        claimedAmount,
        updateClaimedAmount,
        verifyEligibility,
        claimTokens,
        findUser,
        tree
    };
};