import { AccountAddress, GetFungibleAssetMetadataResponse } from "@aptos-labs/ts-sdk";
import { useState, useEffect } from "react";
// Internal utils
import { aptosClient } from "@/utils/aptosClient";
import { getRegistry } from "@/view-functions/getRegistry";

/**
 * A react hook to get fungible asset metadatas.
 *
 * This call can be pretty expensive when fetching a big number of assets,
 * therefore it is not recommended to use it in production
 *
 */
export function useGetAssetMetadata() {
  const [fas, setFAs] = useState<GetFungibleAssetMetadataResponse>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // fetch the contract registry address
        const registry = await getRegistry();
        console.log("Registry:", registry);

        // fetch fungible assets objects created under that contract registry address
        const objects = await getObjects(registry);
        console.log("Objects:", objects);

        // get each fungible asset object metadata
        const metadatas = await getMetadata(objects);
        console.log("Metadatas:", metadatas);

        // Set the fetched metadatas to the state
        setFAs(metadatas);
      } catch (error) {
        console.error("Error fetching asset metadata:", error);
      }
    }
    fetchData();
  }, []);

  return fas;
}

const getObjects = async (registry: [{ inner: string }]) => {
  const objects = await Promise.all(
    registry.map(async (register: { inner: string }) => {
      const formattedRegistry = AccountAddress.from(register.inner).toString();
      const object = await aptosClient().getObjectDataByObjectAddress({
        objectAddress: formattedRegistry,
      });

      return object.owner_address;
    }),
  );
  return objects;
};

const getMetadata = async (objects: Array<string>) => {
  const metadatas = await Promise.all(
    objects.map(async (object: string) => {
      const formattedObjectAddress = AccountAddress.from(object).toString();

      const metadata = await aptosClient().getFungibleAssetMetadata({
        options: {
          where: { creator_address: { _eq: `${formattedObjectAddress}` } },
        },
      });
      return metadata[0];
    }),
  );
  return metadatas;
};
