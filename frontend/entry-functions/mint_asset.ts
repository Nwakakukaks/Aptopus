import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
// Internal utils
import { convertAmountFromHumanReadableToOnChain } from "@/utils/helpers";
import { T_MINTING_MODULE } from "@/constants";

export type MintAssetArguments = {
  assetType: string;
  amount: number;
  decimals: number;
 
};

export const mintAsset = (args: MintAssetArguments): InputTransactionData => {
  const { assetType, amount, decimals } = args;
  return {
    data: {
      function: `${T_MINTING_MODULE}::launchpad::mint_fa`,
      typeArguments: [],
      functionArguments: [assetType, convertAmountFromHumanReadableToOnChain(amount, decimals)],
    },
  };
};
