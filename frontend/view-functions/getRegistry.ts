import { AccountAddress } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/utils/aptosClient";
import { NFT_MODULE_ADDRESS, T_MINTING_MODULE } from "@/constants";

export const getRegistry = async () => {
  const registry = await aptosClient().view<[[{ inner: string }]]>({
    payload: {
      function: `${AccountAddress.from(T_MINTING_MODULE)}::launchpad::get_user_fas`,
      functionArguments: ["0xf9424969a5cfeb4639c4c75c2cd0ca62620ec624f4f28d76c4881a1e567d753f"],
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
