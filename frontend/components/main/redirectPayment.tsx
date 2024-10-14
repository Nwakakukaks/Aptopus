import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const RedirectToPayment: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(true);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  const fetchClaimUrl = async () => {
    setIsLoading(true);
    try {
      const pathParts = window.location.pathname.split("/");
      const shortCode = pathParts[pathParts.length - 1];

      const response = await fetch(`https://aptopus.vercel.app//s/${shortCode}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Invalid data returned");
      }

      setClaimUrl(data.url);
      return data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPopup = async () => {
    
    
    const url = claimUrl || (await fetchClaimUrl());
    console.log(url)
    if (!url) return;

    const popup = window.open(url, 'Aptopus', "width=450,height=600,left=100,top=100,resizable=yes,scrollbars=yes,status=yes");

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      setError("Popup blocked - clicking 'Open' will redirect in the current tab");
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  };

  useEffect(() => {
    handleOpenPopup();
   
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? <div className="text-red-500 mb-4">{error}</div> : null}

      <AlertDialog open={showDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open Claim Page</AlertDialogTitle>
            <AlertDialogDescription>
              Click below to open the claim page in a popup window. If popups are blocked, it will open in the current
              tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button onClick={handleOpenPopup} disabled={isLoading} className="flex items-center gap-2">
                {isLoading ? "Loading..." : "Open Claim Page"}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RedirectToPayment;
