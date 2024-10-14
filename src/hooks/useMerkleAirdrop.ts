import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../components/WalletConnect';
import { MerkleAirdrop } from '../abi/MerkleAirdrop';
import usersList from '../../users.json';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { formatTokenAmount } from '@/utils/tokenUtils';
import { toast } from 'react-toastify';

const MERKLE_AIRDROP_ADDRESS = process.env.NEXT_PUBLIC_MERKLE_AIRDROP_ADDRESS!;

export const useMerkleAirdrop = () => {
    const { account, provider } = useWallet();
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [claimedAmount, setClaimedAmount] = useState<string>("0");
    const [adminList, setAdminList] = useState<string[]>([]);
    const users = useMemo(() => usersList.users, []);
    const tree = useMemo(() => StandardMerkleTree.of(usersList.users, ["address", "uint256"]), []);

    const updateClaimedAmount = useCallback(async () => {
        if (contract && account) {
            const claimed = await contract.claimedAmounts(account);
            setClaimedAmount(formatTokenAmount(claimed));
        }
    }, [contract, account]);

    const updateAdminList = useCallback(async () => {
        if (contract && provider) {
            try {
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 1000);
                
                const filter = contract.filters.AdminAdded();
                const events = await contract.queryFilter(filter, fromBlock) as ethers.EventLog[];
                const addresses = events.map((event) => event.args![0].toLowerCase());
                const uniqueAddresses = Array.from(new Set(addresses));

                const adminStatusPromises = uniqueAddresses.map(async (address) => {
                    const isAdmin = await contract.admins(address);
                    return isAdmin ? address : null;
                });

                const adminStatuses = await Promise.all(adminStatusPromises);
                const currentAdmins = adminStatuses.filter((admin): admin is string => admin !== null);

                setAdminList(currentAdmins);
            } catch (error) {
                console.error('Error updating admin list:', error);
            }
        }
    }, [contract, provider]);

    useEffect(() => {
        const initContract = async () => {
            if (provider && MERKLE_AIRDROP_ADDRESS) {
                try {
                    const signer = await provider.getSigner();
                    const merkleAirdrop = new ethers.Contract(MERKLE_AIRDROP_ADDRESS, MerkleAirdrop.abi, signer);
                    setContract(merkleAirdrop);
                } catch (error: any) {
                    toast.error('Error initializing Merkle Airdrop contract: ');
                }
            }
        };

        initContract();
    }, [provider]);

    useEffect(() => {
        if (contract && account) {
            updateClaimedAmount();
            updateAdminList();
        }
    }, [contract, account, updateClaimedAmount, updateAdminList]);

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
    }, [contract, account, updateClaimedAmount]);

    const addAdmin = useCallback(async (newAdmin: string) => {
        if (contract) {
            try {
                const tx = await contract.addAdmin(newAdmin);
                await tx.wait();
                await updateAdminList();
                toast.success(`Admin ${newAdmin} added successfully`);
                return true;
            } catch (error: any) {
                console.error('Error adding admin:', error);
                if (error.data) {
                    const decodedError = contract.interface.parseError(error.data);
                    const decodedName = decodedError?.name ?? "";
                    
                    switch (decodedName) {
                        case 'NotAdmin':
                            toast.error('You are not an admin.');
                            break;
                        default:
                            toast.error('An unknown error occurred while adding admin.');
                    }
                }
                return false;
            }
        }
        return false;
    }, [contract, updateAdminList]);

    const removeAdmin = useCallback(async (adminToRemove: string) => {
        if (contract) {
            try {
                const tx = await contract.removeAdmin(adminToRemove);
                await tx.wait();
                await updateAdminList();
                toast.success(`Admin ${adminToRemove} removed successfully`);
                return true;
            } catch (error: any) {
                console.error('Error removing admin:', error);
                if (error.data) {
                    const decodedError = contract.interface.parseError(error.data);
                    const decodedName = decodedError?.name ?? "";
                    
                    switch (decodedName) {
                        case 'NotAdmin':
                            toast.error('You are not an admin.');
                            break;
                        default:
                            toast.error('An unknown error occurred while removing admin.');
                    }
                }
                return false;
            }
        }
        return false;
    }, [contract, updateAdminList]);

    const findUser = (address: string): { ix: number, data: string[] } | null => {
        let ix = users.findIndex(add => add[0].toLowerCase() == address.toLowerCase());
        return ix !== -1 ? { ix, data: users[ix] } : null;
    }

    return {
        contract,
        claimedAmount,
        adminList,
        verifyEligibility,
        claimTokens,
        findUser,
        tree,
        updateAdminList,
        addAdmin,
        removeAdmin,
    };
};
