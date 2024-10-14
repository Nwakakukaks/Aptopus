import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Live: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataDisplay, setDataDisplay] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    const url = location.state?.message || "";
    if (url) {
      submitLiveUrl(url);
    }

    // EventSource to listen for live data updates
    const eventSource = new EventSource('https://aptopus.vercel.app//superchat-events');
    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      setDataDisplay(prevData => [
        ...prevData,
        { videoId: data.videoId, message: data.messageText }
      ]);
    };

  
    return () => {
      eventSource.close();
    };
  }, [location.state]);

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

  const submitLiveUrl = async (url: string) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      setLoading(true);
      try {
        const response = await fetch("https://aptopus.vercel.app//start-monitoring", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
          
        });
        const data = await response.json();
        if (data.error) {
          alert(data.error);
        } else {
          alert("Live URL submitted: " + url);
        }
      } catch (error) {
        alert("Error submitting live URL: " + error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter a valid URL.");
    }
  };

  return (
    <div className="text-center bg-gray-100 p-4">
      <div className="analytics-dashboard mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-2xl">Live Mode</h2>

        {loading && <div className="loading-indicator text-center mt-4">Loading...</div>}
        {dataDisplay.length > 0 && (
          <div className="data-display mt-4">
            <h4 className="text-xl">Fetched Messages:</h4>
            <ul>
              {dataDisplay.map((message, index) => (
                <li key={index} className="mt-2">
                  <strong>Video ID:</strong> {message.videoId} <br />
                  <strong>Message:</strong> {message.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Live;
