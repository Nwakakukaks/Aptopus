import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { NFT_MODULE_ADDRESS, T_MINTING_MODULE } from "@/constants";

export type RegistryArguments = {
  address: string;
};

export const getRegistry = async (args: RegistryArguments) => {
  const { address } = args;
  const registry = await aptosClient().view<[[{ inner: string }]]>({
    payload: {
      function: `${AccountAddress.from(T_MINTING_MODULE)}::launchpad::get_user_fas`,
      functionArguments: [address],
    },
  });
  console.log(registry);
  return registry[0];
};

export const getRegistryNFT = async () => {
  const registry = await aptosClient().view<[[{ inner: string }]]>({
    payload: {
      function: `${AccountAddress.from(NFT_MODULE_ADDRESS)}::vestpad::get_registry`,
    },
  });
  return registry[0];
};
