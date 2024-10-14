import { useLocation } from "react-router-dom";

export function LFooter() {
  const location = useLocation();

  // Check if the current path is one of the specified routes
  const isFooterVisible = 
    location.pathname !== "/payment" && 
    location.pathname !== "/claim" && 
    location.pathname !== "/access";

  return (
    <>
      {isFooterVisible && (
        <div className="flex justify-between items-start my-6 px-20">
          <div>
            <p className="text-red-500 font-semibold text-lg">Aptopus</p>
            <p className="text-xs text-gray-500 w-48 lg:w-96">
              Create unique links to receive Aptos tokens from your viewers during live streams.
            </p>
          </div>
          <div className="flex space-x-3 items-center">
            <img src="/icons/Twitter X.svg" className="bg-white rounded-sm w-6 h-6 mr-4" alt="Twitter" />
          </div>
        </div>
      )}
      {/* Todo: add image here */}
    </>
  );
}
