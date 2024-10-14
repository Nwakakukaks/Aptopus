import { T_MINTING_MODULE } from "@/constants";
import { aptosClient } from "@/utils/aptosClient";

export type TokenBalanceArguments = {
  accountAddress: string;
  fa_obj: string;
};

export type MintLimitArguments = {
  fa_obj: string;
};

export const getTokenBalance = async (args: TokenBalanceArguments): Promise<number> => {
  const { accountAddress, fa_obj } = args;
  try {
    const balance = await aptosClient().view({
      payload: {
        function: `${T_MINTING_MODULE}::launchpad::get_mint_balance`,
        typeArguments: [],
        functionArguments: [fa_obj, accountAddress],
      },
    });
    return Number(balance[0]); // Convert to number since it might come as string
  } catch (error) {
    console.error("Error fetching token balance:", error);
    throw error;
  }
};

export const getMintLimit = async (args: MintLimitArguments): Promise<number> => {
  const { fa_obj } = args;
  try {
    const balance = await aptosClient().view({
      payload: {
        function: `${T_MINTING_MODULE}::launchpad::get_mint_limit`,
        typeArguments: [],
        functionArguments: [fa_obj],
      },
    });
    return Number(balance[0]); // Convert to number since it might come as string
  } catch (error) {
    console.error("Error fetching mint limit:", error);
    throw error;
  }
};
