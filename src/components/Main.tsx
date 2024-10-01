'use client'

import { useEffect, useState } from "react";
import ClaimButton from "./ClaimButton";
import { useWallet } from "./WalletConnect";
import { useMerkleAirdrop } from "@/hooks/useMerkleAirdrop";

const Main = () => {
    const { account } = useWallet();
    const { findUser, claimTokens, claimedAmount, tree } = useMerkleAirdrop();
    const [userData, setUserData] = useState<{ ix: number, data: string[] } | null>(null);

    useEffect(() => {
        if (account) {
            setUserData(findUser(account));
        }
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Airdrop Claim</h1>
                {!account ? (
                    <p>Connect your wallet to check if you&apos;re eligible for the airdrop</p>
                ) : (
                    <p>
                        {userData !== null
                            ? "You're eligible to claim the airdrop!"
                            : "You're not eligible to claim the airdrop."}
                    </p>
                )}
                <ClaimButton
                    account={account}
                    userData={userData}
                    claimTokens={claimTokens}
                    claimedAmount={claimedAmount}
                    tree={tree}
                />
            </div>
        </main>
    )
}

export default Main;