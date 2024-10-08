import React, { useEffect, useState } from "react";

const RedirectToPayment: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const shortCode = pathParts[pathParts.length - 1];
    console.log("Attempting to fetch shortCode:", shortCode);

    if (shortCode) {
      fetch(`/api/s/${shortCode}`)
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            console.error("Server response:", text);
            throw new Error(text);
          }
          return response.json(); // Convert response to JSON
        })
        .then((data) => {
          console.log("Received data:", data);
          if (data.url) {
            const popup = window.open(
              data.url,
              "Superchat",
              "width=400,height=600,left=100,top=100,resizable=yes,scrollbars=yes,status=yes"
            );

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
              setError("Popup was blocked. Click here to open the payment page.");
              window.location.href = data.url;
            }
          } else {
            throw new Error("Invalid data returned");
          }
        })
        .catch((error) => {
          console.error("Error during redirect:", error);
          setError(`Error: ${error.message}`);
        });
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {error ? (
        <div 
          className="text-blue-500 mb-4 cursor-pointer hover:underline" 
          onClick={() => {
            const pathParts = window.location.pathname.split("/");
            const shortCode = pathParts[pathParts.length - 1];
            fetch(`/api/s/${shortCode}`)
              .then(response => response.json())
              .then(data => {
                if (data.url) {
                  window.location.href = data.url;
                }
              });
          }}
        >
          {error}
        </div>
      ) : (
        <p>Redirecting to payment page...</p>
      )}
    </div>
  );
};

export default RedirectToPayment;