import React from "react";
import DynamicMint from "./token";

const Claim: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 w-full px-4 pt-24">
      <DynamicMint />
    </div>
  );
};

export default Claim;
