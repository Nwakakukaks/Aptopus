import React, { useState, useRef, FormEvent, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAssetData } from "@/hooks/useGetAssetData";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { mintAsset } from "@/entry-functions/mint_asset";
import { aptosClient } from "@/utils/aptosClient";
import { useQueryClient } from "@tanstack/react-query";

// Internal utils
import { checkIfFund, uploadFile } from "@/utils/Irys";
import { createAsset } from "@/entry-functions/create_asset";
import { useGetAssetMetadata } from "@/hooks/useGetAssetMetadata";
// import { toast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { toast } from "../ui/use-toast";

const DynamicMint = () => {
  const location = useLocation();
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");
  const [address] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");

  const fas = useGetAssetMetadata();

  // Get the last asset_type
  const lastAssetType = useMemo(() => {
    if (fas.length > 0) {
      return fas[fas.length - 1].asset_type;
    }
    return "";
  }, [fas]);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    icon_uri: "",
    project_uri: "",
    mint_fee_per_smallest_unit_of_fa: "",
    pre_mint_amount: "",
    mint_limit_per_addr: "",
    max_supply: "",
    mintTo: "",
    quantity: "",
  });

  const queryClient = useQueryClient();
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosWallet = useWallet();

  const [tokenHash, setTokenHash] = useState<string>("");
  let FA_ADDRESS = lastAssetType;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File | undefined>();
  const { data } = useGetAssetData(FA_ADDRESS);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isuploading, setIsUploading] = useState(false);

  const { asset, userMintBalance = 0, yourBalance = 0, maxSupply = 0, currentSupply = 0 } = data ?? {};

  if (isuploading || error) {
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPreviewImage(reader.result);
          setFormData((prev) => ({ ...prev, icon_uri: file.name }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Asset Function
  const onCreateAsset = async () => {
    try {
      if (!account) {
        toast({
          title: "No wallet connected",
          description: "Please connect a wallet to proceed",
        });
        return;
      }
      if (!image) {
        toast({
          title: "No Image provided",
          description: "Please upload an image to proceed",
        });
        return;
      }

      setIsUploading(true);

      // Check if the account has enough funds
      const funded = await checkIfFund(aptosWallet, image.size);
      if (!funded) throw new Error("Current account balance is not enough to fund a decentralized asset node");

      // Upload the asset file to Irys
      const iconURL = await uploadFile(aptosWallet, image);

      // Submit createAsset transaction
      const response = await signAndSubmitTransaction(
        createAsset({
          maxSupply: Number(formData.max_supply),
          name: formData.name,
          symbol: formData.symbol,
          decimal: Number(formData.decimals),
          iconURL,
          projectURL: formData.project_uri,
          mintFeePerFA: Number(formData.mint_fee_per_smallest_unit_of_fa),
          mintForMyself: Number(formData.pre_mint_amount), // Check if pre-minting
          maxMintPerAccount: Number(formData.mint_limit_per_addr),
        }),
      );

      // Wait for the transaction to be committed to the chain
      const committedTransactionResponse = await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      setTokenHash(response.hash);

      if (committedTransactionResponse.success) {
        toast({
          title: "Success",
          description: `Transaction succeeded, hash: ${committedTransactionResponse.hash}`,
        });
        setSuccess(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Mint Function
  const mintFA = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!asset) {
      return toast({
        title: "Error",
        description: `Asset not found`,
      });
    }

    if (!data?.isMintActive) {
      return toast({
        title: "Error",
        description: `Minting is not available`,
      });
    }

    const amount = parseFloat(formData.quantity);
    if (Number.isNaN(amount) || amount <= 0) {
      return toast({
        title: "Error",
        description: `Invalid mint quantity`,
      });
    }

    const response = await signAndSubmitTransaction(
      mintAsset({
        assetType: asset.asset_type,
        amount,
        decimals: asset.decimals,
        // address: account ? account.address : "0x",
      }),
    );

    const claim = await aptosClient().waitForTransaction({ transactionHash: response.hash });
    queryClient.invalidateQueries();

    if (claim.success) {
      await generateAccessUrl();
      toast({
        title: "Success",
        description: `Token claimed successfully, hash: ${claim.hash}`,
      });
      setSuccess(true);
    }
  };

  const generateAccessUrl = async () => {
    if (videoId && address) {
      try {
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, address: address }),
          
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const accessUrl = `${window.location.origin}/a/${data.shortCode}`;
          setGeneratedUrl(accessUrl);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `An error occurred: ${error}`,
        });
      }
    } else {
      toast({
        variant: "default",
        title: "Access Link Error",
        description: "Failed to generate Access Link",
      });
    }
  };

  useEffect(() => {}, [tokenHash]);

  return (
    <div className=" rounded-none w-[90%] shadow-md mx-auto border-2 border-gray-600 h-full overflow-y-auto p-4 mb-6">
      {location.pathname === "/dashboard" ? (
        <div className="p-4">
          <div className=" flex flex-col items-center justify-center rounded-sm mt-1">
            <img
              src={previewImage ? previewImage : "/icons/upload.svg"}
              alt={`icon`}
              className=" max-w-24 h-auto max-h-40 object-contain mb-4 rounded-full overflow-hidden"
            />

            <div className="mt-1">
              <div className="flex items-center space-x-2 my-1">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center bg-transparent text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Icon
                </Button>
                <Input
                  id="icon_upload"
                  name="icon_upload"
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 text-start">
              <div>
                <Label className="text-gray-100" htmlFor="name">
                  Token Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter token name"
                  className="text-gray-200 bg-transparent rounded-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-100" htmlFor="symbol">
                  Token Symbol
                </Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="Enter token symbol"
                  className="text-gray-200 bg-transparent rounded-sm mt-1"
                />
              </div>
            </div>

            <div className="mt-4 text-start">
              <Label className="text-gray-100" htmlFor="decimals">
                Decimals
              </Label>
              <Input
                id="decimals"
                name="decimals"
                type="number"
                value={formData.decimals}
                onChange={handleInputChange}
                placeholder="Enter number of decimal places"
                className="text-gray-200 bg-transparent rounded-sm mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 my-6">
              <Checkbox
                className=" bg-white"
                id="advanced"
                checked={showAdvanced}
                onCheckedChange={() => setShowAdvanced(!showAdvanced)}
              />
              <Label className="text-gray-100" htmlFor="advanced">
                Show advanced options
              </Label>
            </div>

            {showAdvanced && (
              <div className="space-y-4 border-t pb-4">
                {/* <div>
                  <Label className="text-gray-100" htmlFor="project_uri">Project URI</Label>
                  <Input
                    id="project_uri"
                    name="project_uri"
                    value={formData.project_uri}
                    onChange={handleInputChange}
                    placeholder="Enter project URI"
                  />
                </div> */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-100" htmlFor="mint_fee_per_smallest_unit_of_fa">Mint Fee</Label>
                    <Input
                      id="mint_fee_per_smallest_unit_of_fa"
                      name="mint_fee_per_smallest_unit_of_fa"
                      type="number"
                      value={formData.mint_fee_per_smallest_unit_of_fa}
                      onChange={handleInputChange}
                      placeholder="Mint fee per smallest unit"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-100" htmlFor="pre_mint_amount">Pre-mint Amount</Label>
                    <Input
                      id="pre_mint_amount"
                      name="pre_mint_amount"
                      type="number"
                      value={formData.pre_mint_amount}
                      onChange={handleInputChange}
                      placeholder="Enter pre-mint amount"
                    />
                  </div>
                </div> */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-start">
                  <div>
                    <Label className="text-gray-100" htmlFor="mint_limit_per_addr">
                      Mint Limit per Address
                    </Label>
                    <Input
                      id="mint_limit_per_addr"
                      name="mint_limit_per_addr"
                      type="number"
                      value={formData.mint_limit_per_addr}
                      onChange={handleInputChange}
                      placeholder="Mint limit per address"
                      className="text-gray-200 bg-transparent rounded-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-100" htmlFor="max_supply">
                      Max Supply
                    </Label>
                    <Input
                      id="max_supply"
                      name="max_supply"
                      type="number"
                      value={formData.max_supply}
                      onChange={handleInputChange}
                      placeholder="Enter max supply (optional)"
                      className="text-gray-200 bg-transparent rounded-sm mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <Button
              onClick={onCreateAsset}
              disabled={loading}
              className={`w-full text-lg mt-4 ${
                loading ? "bg-gradient-to-r from-red-500 to-white animate-pulse" : success ? "" : ""
              } text-black bg-slate-50 hover:bg-slate-50 font-bold py-2 px-4 rounded`}
            >
              {loading ? "Processing..." : success ? "✓ Done!" : "Create Token"}
            </Button>

            {/* <p className="text-white">Token: {asset?.asset_type}</p> */}
          </>
        </div>
      ) : (
        <div className="space-y-6 p-6">
          <div className=" flex  items-center justify-center rounded-sm mt-1">
            <img
              src={asset ? asset.icon_uri : "/icons/placeh.svg"}
              alt={`icon`}
              className=" max-w-24 h-auto max-h-40 object-contain mb-4 rounded-full overflow-hidden"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <Label className="text-gray-100 font-medium text-lg" htmlFor="quantity">
                Quantity to Mint
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity to mint"
                className="bg-transparent text-white rounded-none mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-2 rounded-lg">
            <div className="flex space-x-3 items-center text-start justify-between">
              <div>
                <p className="font-medium text-sm text-gray-400">Claimable Token</p>
                <p className="text-base font-semibold text-gray-100 ">
                  {Math.min(userMintBalance, maxSupply - currentSupply)}
                  <span className=" font-medium text-gray-200 ml-1">{asset?.symbol}</span>
                </p>
                <p className="text-xs text-gray-400">Available to claim</p>
              </div>

              <div>
                <p className="font-medium text-sm text-gray-400">Your Balance</p>
                <p className="text-base font-semibold text-gray-100 ">
                  {yourBalance}
                  <span className=" font-medium text-gray-200 ml-1">{asset?.symbol}</span>
                </p>
                <p className="text-xs text-gray-400">Current Holdings</p>
              </div>

              <div>
                <p className="font-medium text-sm text-gray-400">Total Supply</p>
                <p className="text-base font-semibold text-gray-100 ">
                  {currentSupply} / {maxSupply}
                </p>
                <p className="text-xs text-gray-400">Claimed / Max Supply</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              variant={"outline"}
              onClick={mintFA}
              disabled={loading}
              className={`w-full ${
                loading ? "bg-gradient-to-r from-red-500 to-white animate-pulse" : success ? "" : ""
              } text-black text-base font-bold py-1 px-4 rounded border border-black `}
            >
              {loading ? "Claiming..." : success ? "✓ Claimed Successfully!" : "Claim Token"}
            </Button>

            {/* <div className="flex justify-between items-center text-gray-200">
              <span>Token Address:</span>
              <a
                className="text-red-500 hover:underline truncate max-w-[200px]"
                target="_blank"
                href={`https://explorer.aptoslabs.com/account/${asset?.asset_type}?network=testnet`}
                rel="noopener noreferrer"
              >
                {asset?.asset_type}
              </a>
            </div> */}
          </div>

          {success && (
            <div className="bg-white text-gray-900 rounded-md p-2 mt-4">
              <p className="text-sm text-wrap line-clamp-1">
                Hurray! Unlock creators exclusive contents here: <a href={generatedUrl} className="text-red-500">{generatedUrl}</a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicMint;
