const dotenv = require("dotenv");
dotenv.config();

const { youtube, oauth2Client, getLiveChatId, deleteMessage } = require("./index");
const { isValidMessage, isSuperchatFormat } = require("./messageValidator");
const EventEmitter = require("events");
const fetch = require("node-fetch");

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_NAMESPACE_ID = process.env.CLOUDFLARE_NAMESPACE_ID;

// Create an instance of EventEmitter
const eventEmitter = new EventEmitter();

// Store active monitoring intervals
const monitoringIntervals = new Map();
// Store the last checked message ID for each video
const lastCheckedMessageId = new Map();

async function getKVValue(key) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${key}`,
    {
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.text();
}

async function putKVValue(key, value) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${CLOUDFLARE_NAMESPACE_ID}/values/${key}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: value,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function monitorLiveChat(videoId) {
  if (!videoId) {
    console.error("No video ID provided");
    return;
  }

  // Check if already monitoring this video
  if (monitoringIntervals.has(videoId)) {
    console.log(`Already monitoring video ${videoId}`);
    return;
  }

  try {
    // Get the live chat ID for the video
    const liveChatId = await getLiveChatId(videoId);
    if (!liveChatId) {
      throw new Error("Failed to get live chat ID");
    }

    console.log(`Starting to monitor live chat for video ${videoId}`);

    // Set up an interval to check for new messages every 3 seconds
    const intervalId = setInterval(() => checkLiveChatMessages(videoId, liveChatId), 3000);
    monitoringIntervals.set(videoId, intervalId);
  } catch (error) {
    console.error("Error starting live chat monitor:", error);
    stopMonitoring(videoId);
  }
}

async function checkLiveChatMessages(videoId, liveChatId) {
  if (!videoId || !liveChatId) {
    console.error("Missing required parameters");
    stopMonitoring(videoId);
    return;
  }

  try {
    // Check if the live stream is still active
    const videoResponse = await youtube.videos.list({
      auth: oauth2Client,
      part: "liveStreamingDetails",
      id: videoId,
    });

    if (!videoResponse?.data?.items?.[0]) {
      console.log("No video found or live stream ended. Stopping monitor.");
      stopMonitoring(videoId);
      return;
    }

    const video = videoResponse.data.items[0];

    if (!video.liveStreamingDetails?.activeLiveChatId || video.liveStreamingDetails.actualEndTime) {
      console.log("Live stream ended or not found. Stopping monitor.");
      stopMonitoring(videoId);
      return;
    }

    // Fetch new messages since the last check using the correct API endpoint
    const response = await youtube.liveChatMessages.list({
      auth: oauth2Client,
      liveChatId: liveChatId,
      part: "snippet,id",
      pageToken: lastCheckedMessageId.get(videoId),
    });

    if (!response?.data?.items) {
      console.log("No new messages found in response");
      return;
    }

    // Update the last checked message ID if we have a valid next page token
    if (response.data.nextPageToken) {
      lastCheckedMessageId.set(videoId, response.data.nextPageToken);
    }

    // Process each new message
    for (const message of response.data.items) {
      if (message?.snippet?.textMessageDetails?.messageText) {
        await processMessage(message, liveChatId, videoId);
      }
    }
  } catch (error) {
    handleError(error, videoId);
  }
}

function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000;
}

async function processMessage(message, liveChatId, videoId) {
  try {
    const messageText = message.snippet.textMessageDetails.messageText;
    const messageId = message.id;

    if (!messageText || !messageId) {
      console.log("Invalid message format, skipping");
      return;
    }

    console.log("Processing message:", messageText);

    // Check for any suspicious patterns first
    if (messageText.includes("⚡") || messageText.toLowerCase().includes("superchat".toLowerCase())) {
      // Only proceed with validation if it matches our exact format
      if (isSuperchatFormat(messageText)) {
        console.log("Message is in valid superchat format:", messageText);

        // Check if this superchat was previously validated
        let validSuperchats = await getKVValue(`validSuperchats:${videoId}`);
        validSuperchats = JSON.parse(validSuperchats || "[]");
        if (validSuperchats.includes(messageId)) {
          console.log("Previously validated superchat:", messageText);
          return;
        }

        // Extract and validate amount
        const match = messageText.match(/\[(\d+(?:\.\d+)?)\s/);
        if (match && validateAmount(match[1])) {
          // Valid superchat with valid amount
          console.log("Valid superchat detected:", messageText);

          validSuperchats.push(messageId);
          await putKVValue(`validSuperchats:${videoId}`, JSON.stringify(validSuperchats));

          console.log("Emitting new superchat event:", { videoId, messageText });
          eventEmitter.emit("newSuperchat", { videoId, messageText });
        } else {
          console.log("Invalid amount in superchat:", messageText);
          await deleteMessage(messageId, liveChatId);
        }
      } else {
        // Message contains superchat-like content but doesn't match our format
        console.log("Fake superchat detected:", messageText);
        await deleteMessage(messageId, liveChatId);
        console.log("Fake superchat deleted");
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

function handleError(error, videoId) {
  console.error("Error in live chat monitoring:", error);

  const errorMessage = error.message || "Unknown error";
  const errorResponse = error.response;

  if (
    error.code === 404 ||
    errorResponse?.status === 404 ||
    errorMessage.includes("liveChatNotFound") ||
    errorMessage.includes("items")
  ) {
    console.log("Live stream ended or chat not accessible. Stopping monitor.");
    stopMonitoring(videoId);
  } else {
    console.log(`Stopping monitor for video ${videoId} due to error:`, errorMessage);
    stopMonitoring(videoId);
  }
}

function stopMonitoring(videoId) {
  if (monitoringIntervals.has(videoId)) {
    clearInterval(monitoringIntervals.get(videoId));
    monitoringIntervals.delete(videoId);
    lastCheckedMessageId.delete(videoId);
    console.log(`Stopped monitoring for video ${videoId}`);
  }
}

module.exports = { monitorLiveChat, stopMonitoring, eventEmitter };