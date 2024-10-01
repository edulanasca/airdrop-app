'use client';

import { useState, useEffect } from 'react';
import { useMerkleAirdrop } from '@/hooks/useMerkleAirdrop';
import { useSamoyedCoin } from '@/hooks/useSamoyedCoin';
import { formatTokenAmount } from '@/utils/tokenUtils';
import Header from '@/components/Header';
import { truncateAddress } from '@/utils/walletUtils';

const StatsPage = () => {
    const { contract: merkleAirdropContract } = useMerkleAirdrop();
    const { contract: tokenContract } = useSamoyedCoin();
    const [totalClaimed, setTotalClaimed] = useState<bigint>(BigInt(0));
    const [claimsByWallet, setClaimsByWallet] = useState<{ [key: string]: string }>({});
    const [lastClaimer, setLastClaimer] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (merkleAirdropContract && tokenContract) {
                const filter = merkleAirdropContract.filters.TokensClaimed();
                const events = await merkleAirdropContract.queryFilter(filter);

                let total = BigInt(0);
                const claims: { [key: string]: bigint } = {};

                for (const event of events) {
                    // @ts-ignore
                    const { claimant, amount } = event.args!;
                    total += amount;
                    claims[claimant] = (claims[claimant] || BigInt(0)) + amount;
                }

                setTotalClaimed(total);
                setClaimsByWallet(Object.fromEntries(Object.entries(claims).map(([k, v]) => [k, formatTokenAmount(v)])));

                if (events.length > 0) {
                    // @ts-ignore
                    setLastClaimer(events[events.length - 1].args!.claimant);
                }
            }
        };

        fetchStats();
    }, [merkleAirdropContract, tokenContract]);

    return (
        <div className='min-h-screen'>
            <Header />
            <main className="max-w-4xl mx-auto mt-8 p-4">
                <h1 className="text-3xl font-bold mb-6">Airdrop Stats</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">Total Claimed: {formatTokenAmount(totalClaimed)} tokens</h2>
                        {lastClaimer && <p className="mt-1 max-w-2xl text-sm text-gray-500">Last claimer: {lastClaimer}</p>}
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Wallet</dt>
                                <dt className="text-sm font-medium text-gray-500">Claimed Amount</dt>
                            </div>
                            {Object.entries(claimsByWallet).map(([wallet, amount]) => (
                                <div key={wallet} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-1">{truncateAddress(wallet)}</dd>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-1">{amount}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StatsPage;