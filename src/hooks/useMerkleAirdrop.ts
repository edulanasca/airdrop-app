import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import MerkleAirdropABI from '../abi/MerkleAirdrop.json';
import usersList from '../../users.json';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { formatTokenAmount } from '@/utils/tokenUtils';
import { toast } from 'react-toastify';

const MERKLE_AIRDROP_ADDRESS = process.env.NEXT_PUBLIC_MERKLE_AIRDROP_ADDRESS!;

export const useMerkleAirdrop = () => {
    const { account, provider } = useWallet();
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
            if (provider && MERKLE_AIRDROP_ADDRESS) {
                try {
                    const signer = await provider.getSigner();
                    const merkleAirdrop = new ethers.Contract(MERKLE_AIRDROP_ADDRESS, MerkleAirdropABI.abi, signer);
                    setContract(merkleAirdrop);
                } catch (error: any) {
                    toast.error('Error initializing Merkle Airdrop contract: ');
                }
            }
        };

        initContract();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider]);

    useEffect(() => {
        if (contract && account) {
            updateClaimedAmount();
        }
    }, [contract, account, updateClaimedAmount]);

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
                toast.success('Tokens claimed successfully!');
            } catch (error: any) {
                if (error.data) {
                    // This is likely a custom error
                    const decodedError = contract.interface.parseError(error.data);
                    const decodedName = decodedError?.name ?? "";
                    
                    switch (decodedName) {
                        case 'AmountMustBeGreaterThanZero':
                            toast.error('Amount to claim must be greater than zero.');
                            break;
                        case 'InvalidProof':
                            toast.error('Invalid proof. You may not be eligible for this airdrop.');
                            break;
                        case 'ClaimExceedsAssignedTokens':
                            toast.error('Claim amount exceeds your assigned tokens.');
                            break;
                        case 'TransferFailed':
                            toast.error('Token transfer failed. Please try again later.');
                            break;
                        case 'ContractPaused':
                            toast.error('Contract is paused from claiming.');
                            break;
                        default:
                            toast.error('An unknown error occurred.');
                    }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract, account]);

    const findUser = (address: string): { ix: number, data: string[] } | null => {
        let ix = users.findIndex(add => add[0] == address);
        return ix !== -1 ? { ix, data: users[ix] } : null;
    }

    return {
        contract,
        claimedAmount,
        verifyEligibility,
        claimTokens,
        findUser,
        tree
    };
};