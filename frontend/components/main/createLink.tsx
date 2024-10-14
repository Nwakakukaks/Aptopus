import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon } from "lucide-react";

const CreatorLinkGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");
  const [aptosAddress, setAptosAddress] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const handleStreams = () => {
    navigate("/streams");
  };

  const handleTransactions = () => {
    navigate("/transactions");
  };

  const copyLink = () => {
    navigator.clipboard
      .writeText(generatedUrl)
      .then(() => {
        toast({
          variant: "default",
          title: "Link copied",
          description: "Creator link copied successfully!",
        });
      })
      .catch((error) => {
        console.error("Error copying the link: ", error);
      });
  };

  const generateSuperchatUrl = async () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId && aptosAddress) {
      try {
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
         
          body: JSON.stringify({ videoId, address: aptosAddress }),
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const superchatUrl = `${window.location.origin}/s/${data.shortCode}`;
          setGeneratedUrl(superchatUrl);
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
        title: "Enter your Live URL and Address",
        description: "Please enter your live url and aptos address to proceed",
      });
    }
  };

  const extractVideoId = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        if (parsedUrl.pathname.startsWith("/live/")) {
          return parsedUrl.pathname.split("/")[2];
        } else if (parsedUrl.searchParams.has("v")) {
          return parsedUrl.searchParams.get("v");
        } else if (hostname === "youtu.be") {
          return parsedUrl.pathname.slice(1);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
    return null;
  };

  return (
    <div className="flex justify-center items-center mt-10 h-[70vh]">
      <div className="border-2 border-gray-500 flex flex-col justify-center items-center gap-2 rounded-sm px-4 py-12 shadow-lg w-[90%]">
        <h1 className="text-2xl text-red-600">Generate Your Unique Link</h1>
        <p>Generate a unique URL and pin it in your live chat</p>

        <div className="flex space-x-4 w-[90%]">
          <Input
            type="text"
            placeholder="Enter your YouTube Live URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          />
          <Input
            type="text"
            placeholder="Enter your Aptos address"
            value={aptosAddress}
            onChange={(e) => setAptosAddress(e.target.value)}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          />
        </div>

        <Button
          className="submit-button mt-4 bg-red-600 text-white p-2 rounded hover:bg-red-700 w-[90%]"
          onClick={generateSuperchatUrl}
        >
          Generate Creator Link
        </Button>
        {generatedUrl && (
          <div className="flex space-x-3 items-center justify-center mt-4 p-4 bg-white rounded-sm shadow text-gray-900 w-[90%]">
            <p className="text-sm text-center">
              Your generated URL:{" "}
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
                {generatedUrl}
              </a>
            </p>

            <button onClick={copyLink}>
              <CopyIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mt-8 w-[90%]">
          <Card
            onClick={handleStreams}
            className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 w-full cursor-pointer "
          >
            <CardContent className="flex items-center justify-center space-x-3 mt-3">
              <div className="flex items-center">
                <img src="/icons/wallet.svg" className="h-14 w-14 p-2 rounded-sm mx-auto" alt="Wallet icon" />
              </div>
              <p className="text-gray-100 text-lg font-medium"> Past streams</p>
            </CardContent>
          </Card>

          <Card
            onClick={handleTransactions}
            className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 w-full cursor-pointer"
          >
            <CardContent className="flex space-x-3 items-center justify-center mt-3">
              <div className="flex items-center">
                <img src="/icons/member.svg" className="h-14 w-14 p-2 rounded-sm mx-auto" alt="Member icon" />
              </div>
              <p className="text-gray-100 text-lg font-medium"> Transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatorLinkGenerator;