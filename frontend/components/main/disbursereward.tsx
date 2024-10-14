import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
// import { mintNFT } from "@/entry-functions/mint_nft";

interface Transaction {
  amount: string;
  videoId: string;
  timestamp: string;
  address: string;
  transactionHash: string;
  message: string;
}

const DisburseRewards = ({ videoId, transactions }: { videoId: string; transactions: Transaction[] }) => {



  // const { account, signAndSubmitTransaction } = useWallet();
  // const [loadingToken, setLoadingToken] = useState(false);
  // const [loadingNFT, setLoadingNFT] = useState(false);
  const [status] = useState<{ [key: string]: "pending" | "success" | "error" }>({});
  const uniqueAddresses = Array.from(new Set(transactions.map((t) => t.address)));
  const totalContributions = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  // const handleDisburseNFTs = async () => {
  //   if (!account || !collection) {
  //     toast({
  //       title: "Error",
  //       description: "Please connect wallet and ensure you have an NFT collection",
  //     });
  //     return;
  //   }
  
  //   setLoadingNFT(true);
  //   let allSuccess = true; // Track overall success
  //   try {
  //     for (const address of uniqueAddresses) {
  //       setStatus((prev) => ({ ...prev, [address]: "pending" }));
  //       try {
  //       //   const response = await signAndSubmitTransaction(
  //       //     mintNFT({
  //       //       collectionId: collection.collection_id,
  //       //       amount: 1,
  //       //       address: address,
  //       //     }),
  //       //   );
  //       //   await aptosClient().waitForTransaction({ transactionHash: response.hash });
  //         setStatus((prev) => ({ ...prev, [address]: "success" }));
  //       } catch (error) {
  //         allSuccess = false; // Mark as not all succeeded
  //         setStatus((prev) => ({ ...prev, [address]: "error" }));
  //         console.error(`Error minting NFT for ${address}:`, error);
  //       }
  //     }
  
  //     if (allSuccess) {
  //       toast({
  //         title: "Success",
  //         description: "All NFTs have been successfully disbursed.",
  //       });
  //     } else {
  //       toast({
  //         title: "Partial Success",
  //         description: "Some NFTs could not be disbursed.",
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to disburse NFTs",
  //     });
  //   } finally {
  //     setLoadingNFT(false);
  //   }
  // };

  // const handleDisburseTokens = async () => {
  //   if (!account) {
  //     toast({
  //       title: "Error",
  //       description: "Please connect wallet",
  //     });
  //     return;
  //   }
  
  //   setLoadingToken(true);
  //   let allSuccess = true; // Track overall success
  //   try {
  //     for (const address of uniqueAddresses) {
  //       setStatus((prev) => ({ ...prev, [address]: "pending" }));
  //       try {
  //         const response = await signAndSubmitTransaction(
  //           mintAsset({
  //             assetType: "0x996ef140a51d2301075bca23c32e9432e4b23909d3b090ae2247c8b6ef70d9a8",
  //             amount: 1,
  //             address: address,
  //             decimals: 8,
  //           }),
  //         );
  //         await aptosClient().waitForTransaction({ transactionHash: response.hash });
  //         setStatus((prev) => ({ ...prev, [address]: "success" }));
  //       } catch (error) {
  //         allSuccess = false; // Mark as not all succeeded
  //         setStatus((prev) => ({ ...prev, [address]: "error" }));
  //         console.error(`Error minting token for ${address}:`, error);
  //       }
  //     }
  
  //     if (allSuccess) {
  //       toast({
  //         title: "Success",
  //         description: "All tokens have been successfully disbursed.",
  //       });
  //     } else {
  //       toast({
  //         title: "Partial Success",
  //         description: "Some tokens could not be disbursed.",
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to disburse tokens",
  //     });
  //   } finally {
  //     setLoadingToken(false);
  //   }
  // };
  
  

  return (
    <div className="bg-white rounded-none w-full shadow-md mx-auto border-2 border-black font-vt323">
      <div className="h-6 bg-red-500 w-full flex justify-between px-2">
        <p className="text-base font-semibold text-black">{videoId}</p>
        {/* <img src="https://utfs.io/f/PKy8oE1GN2J3JMeRo2HVozIYU8DFRWmkp7SC4bh16KiGHZfv" alt="Logo" /> */}
      </div>

      <div className="p-4 text-center">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-bold">Stream Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Contributors</p>
                <p className="text-2xl font-bold">{uniqueAddresses.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Contributions</p>
                <p className="text-2xl font-bold">{totalContributions.toFixed(3)} ETH</p>
              </div>
            </div>

            {/* <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={handleDisburseNFTs}
                  disabled={loadingNFT}
                  className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-gray-100 text-black font-bold py-2 px-4 border border-black"
                >
                  {loadingNFT ? <Loader2 className="animate-spin" /> : <Award />}
                  Disburse NFTs
                </button>

                <button
                  onClick={handleDisburseTokens}
                  disabled={loadingToken}
                  className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-gray-100 text-black font-bold py-2 px-4 border border-black"
                >
                  {loadingToken ? <Loader2 className="animate-spin" /> : <Coins />}
                  Disburse Tokens
                </button>
              </div>
            </div> */}

            <div className="mt-4 space-y-2 text-center">
              <h3 className="font-semibold">Contributors</h3>
              {uniqueAddresses.map((address) => (
                <div key={address} className="flex items-center justify-between p-2 border border-gray-200">
                  <span className="font-mono text-sm">{address}</span>
                  {status[address] && (
                    <span className="flex items-center">
                      {status[address] === "pending" && <Loader2 className="animate-spin h-4 w-4" />}
                      {status[address] === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {status[address] === "error" && <p className=" text-red-500 text-sm font-semibold">Failed </p>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisburseRewards;
