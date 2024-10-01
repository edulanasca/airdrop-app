import { useState } from 'react';
import { formatTokenAmount, parseTokenAmount } from '@/utils/tokenUtils';
import { ToastContainer } from 'react-toastify';

interface ClaimButtonProps {
  account: string | null;
  userData: { ix: number, data: string[] } | null;
  claimTokens: any;
  claimedAmount: string;
  tree: any;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ account, userData, claimTokens, claimedAmount, tree }) => {
  const [claiming, setClaiming] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');

  if (!account || !userData) {
    return null;
  }

  const totalClaimable = BigInt(userData.data[1]);
  const formattedTotalClaimable = formatTokenAmount(totalClaimable);

  const claim = async () => {
    if (userData) {
      setClaiming(true);
      const proof = tree.getProof(userData.ix);
      const amountToClaim = parseTokenAmount(claimAmount) || totalClaimable;
      await claimTokens(totalClaimable, amountToClaim, proof);
      setClaiming(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-2">Total claimable: {formattedTotalClaimable} tokens</p>
      <p className="mb-2">Claimed: {claimedAmount} tokens</p>
      <input
        type="text"
        value={claimAmount}
        onChange={(e) => setClaimAmount(e.target.value)}
        placeholder="Amount to claim (leave empty for max)"
        className="w-full p-2 mb-2 border rounded text-gray-800"
      />
      <button
        onClick={claim}
        disabled={claiming}
        className={`w-full ${claiming
          ? 'bg-gray-500 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-700'
        } text-white font-bold py-2 px-4 rounded`}
      >
        {claiming ? 'Claiming...' : 'Claim Tokens'}
      </button>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ClaimButton;