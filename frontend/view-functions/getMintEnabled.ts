import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { NFT_MODULE_ADDRESS, T_MINTING_MODULE } from "@/constants";

type GetMintEnabledArguments = {
  fa_address: string;
};

export const getMintEnabled = async ({ fa_address }: GetMintEnabledArguments) => {
  const mintEnabled = await aptosClient().view<[boolean]>({
    payload: {
      function: `${AccountAddress.from(T_MINTING_MODULE)}::launchpad::is_mint_enabled`,
      functionArguments: [fa_address],
    },
  });

  return mintEnabled[0];
};

type GetMintEnabledArgumentsNFT = {
  collection_address: string;
};

export const getMintEnabledNFT = async ({ collection_address }: GetMintEnabledArgumentsNFT) => {
  const mintEnabled = await aptosClient().view<[boolean]>({
    payload: {
      function: `${AccountAddress.from(NFT_MODULE_ADDRESS)}::vestpad::is_mint_enabled`,
      functionArguments: [collection_address],
    },
  });

  return mintEnabled[0];
};