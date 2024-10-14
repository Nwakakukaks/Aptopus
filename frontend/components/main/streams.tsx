import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import DisburseRewards from "./disbursereward";

interface Transaction {
  amount: string;
  videoId: string;
  timestamp: string;
  address: string;
  transactionHash: string;
  message: string;
}

// Group transactions by video ID
const groupTransactionsByVideoId = (transactions: Transaction[]) => {
  return transactions.reduce((acc: Record<string, Transaction[]>, transaction) => {
    if (!acc[transaction.videoId]) {
      acc[transaction.videoId] = [];
    }
    acc[transaction.videoId].push(transaction);
    return acc;
  }, {});
};

const Streams: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [groupedStreams, setGroupedStreams] = useState<Record<string, Transaction[]>>({});
  const { account } = useWallet();

  const address = account?.address;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("https://aptopus-backend.vercel.app/valid-transactions"); // Adjust the URL if needed
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data: Transaction[] = await response.json();
        
        // Filter transactions by address
        const filteredData = data.filter(transaction => transaction.address === address);
        
        const groupedData = groupTransactionsByVideoId(filteredData);
        setGroupedStreams(groupedData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchTransactions();
    }
  }, [address]); 

  return (
    <div className="mt-6 text-gray-100 p-4 rounded shadow overflow-y-auto h-[100vh]">
      <h2 className="text-xl">Past Streams</h2>

      {loading && <div className="loading-indicator text-center mt-4">Loading...</div>}

      {!loading && Object.keys(groupedStreams).length === 0 && (
        <div className="no-data text-center mt-4">No past streams found.</div>
      )}

      {!loading && Object.keys(groupedStreams).length > 0 && (
        <div className="mt-4">
          {Object.entries(groupedStreams).map(([videoId, transactions]) => (
            <div key={videoId} className="mb-4">
              <DisburseRewards videoId={videoId} transactions={transactions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Streams;
