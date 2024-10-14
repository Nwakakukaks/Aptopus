import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";

interface Transaction {
  amount: string;
  videoId: string;
  timestamp: string;
  address: string;
  transactionHash: string;
  message: string;
}

// Utility function to shorten crypto addresses and hashes
const shortenString = (str: string, maxLength: number = 10): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, 5)}...${str.slice(-5)}`;
};

const Transactions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dataDisplay, setDataDisplay] = useState<Transaction[]>([]);
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
        setDataDisplay(filteredData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchTransactions();
    }
  }, [address]); // Fetch when address changes

  return (
    <div className="analytics-dashboard mt-6 p-4 rounded-sm mx-auto">
      <h2 className="text-xl">Transactions</h2>

      {loading && <div className="loading-indicator text-center mt-4">Loading...</div>}

      {!loading && dataDisplay.length === 0 && <div className="no-data text-center mt-4">No transactions found.</div>}

      {!loading && dataDisplay.length > 0 && (
        <table className="min-w-full mt-4 border-2 border-gray-700 text-gray-200 overflow-y-auto">
          <thead>
            <tr className="bg-red-500 text-black">
              <th className="border px-4 py-1">Amount</th>
              <th className="border px-4 py-1">Video ID</th>
              <th className="border px-4 py-1">Timestamp</th>
              <th className="border px-4 py-1">Sender</th>
              <th className="border px-4 py-1">Hash</th>
              <th className="border px-4 py-1">Message</th>
            </tr>
          </thead>
          <tbody>
            {dataDisplay.map((transaction) => (
              <tr key={transaction.transactionHash} className="bg-white text-black hover:bg-red-100">
                <td className="border px-4 py-2 text-sm">{transaction.amount}</td>
                <td className="border px-4 py-2 text-sm">{transaction.videoId}</td>
                <td className="border px-4 py-2 text-sm">{new Date(transaction.timestamp).toLocaleString()}</td>
                <td className="border px-4 py-2 text-sm">{shortenString(transaction.address)}</td>
                <td className="border px-4 py-2 text-sm">{shortenString(transaction.transactionHash)}</td>
                <td className="border px-4 py-2 text-sm">{transaction.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;
