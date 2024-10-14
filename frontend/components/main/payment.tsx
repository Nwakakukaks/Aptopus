import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { transferAPT } from "@/entry-functions/transferAPT";
import { aptosClient } from "@/utils/aptosClient";
import { toast } from "../ui/use-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";

const Payment: React.FC = () => {
  const { signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");
  const [address] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");

  const sendSuperchat = async () => {
    if (message && amount) {
      setLoading(true);

      try {
        const response = await fetch("https://aptopus-backend.vercel.app/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            amount: parseInt(amount),
            videoId,
            address: new URLSearchParams(window.location.search).get("lnaddr"),
          }),
        });
        const data = await response.json();

        if (data.error) {
          alert(data.error);
        } else {
          await submitPayment();
        }
      } catch (error) {
        alert("Error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const submitPayment = async () => {
    setLoading(true);

    const address = new URLSearchParams(window.location.search).get("lnaddr");
    const transferAmount = Math.floor(parseFloat(amount) * Math.pow(10, 8)); // Use parseFloat

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: "Wrong number format",
        description: "Please enter a valid number",
      });
      setLoading(false);
      return;
    }

    try {
      const committedTransaction = await signAndSubmitTransaction(
        transferAPT({
          to: address!,
          amount: transferAmount,
        }),
      );

      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      if (executedTransaction && executedTransaction.hash) {
        queryClient.invalidateQueries();

        toast({
          title: "Success",
          description: `Transaction succeeded, hash: ${executedTransaction.hash}`,
        });

        const hash = executedTransaction.hash;
        // Simulate the payment
        const response = await fetch("https://aptopus-backend.vercel.app/simulate-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            amount,
            videoId,
            address,
            hash,
          }),
        });

        const data = await response.json();
        if (data.success) {
          showSuccessMessage();
        }
      } else {
        toast({
          title: "Error",
          description: "Transaction failed. Please try again.",
        });
      }
    } catch (error) {
      alert("Error simulating payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = async () => {
    await generateClaimUrl();
    setSuccessMessage(`Your Superchat has been posted to YouTube.\nMessage: ${message}\nAmount: ${amount} APTO`);
  };

  const generateClaimUrl = async () => {
    if (videoId && address) {
      try {
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, address: address }),
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const claimUrl = `${window.location.origin}/c/${data.shortCode}`;
          setGeneratedUrl(claimUrl);
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
        title: "Claim Link Error",
        description: "Failed to generate Claim Link",
      });
    }
  };

  return (
    <div className="flex justify-center items-center mx-auto h-[75vh]">
      <div className={`bg-white rounded-lg shadow-md px-6 py-12 w-[85%]`}>
        <h1 className="text-2xl text-red-600">Aptopus 🐙</h1>
        <Input
          name="message"
          placeholder="Enter your Superchat message"
          type="text"
          maxLength={220}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded p-2 mt-2 mb-4 text-gray-800"
        />
        <Input
          name="amount"
          placeholder="Amount in APTOS"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded p-2 mt-2 mb-4 text-gray-800"
        />
        <Button
          id="send-superchat-button"
          onClick={sendSuperchat}
          disabled={loading}
          className={`w-full bg-gradient-to-br from-red-600 to-red-800 text-white rounded p-2 transition-all duration-300 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? "Sending..." : "Send Superchat"}
        </Button>
      </div>

      {successMessage && (
        <div className="bg-white text-gray-900 rounded-md p-2 mt-4">
          <h2 className="text-lg font-bold">Payment Successful!</h2>
          <p className="text-sm">{successMessage}</p>
          <p className="text-sm">
            Claim your reward token here: <a className="text-red-500">{generatedUrl}</a>
          </p>
          <p className="text-sm">
            Claim your reward token here: <a className="text-red-500">{generatedUrl}</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default Payment;
