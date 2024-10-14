const dotenv = require("dotenv");
dotenv.config();

const fetch = require("node-fetch");

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_NAMESPACE_ID = process.env.CLOUDFLARE_NAMESPACE_ID;

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

async function addValidMessage(message) {
  try {
    let validMessages = await getKVValue("validMessages");
    validMessages = JSON.parse(validMessages || "[]");
    validMessages.push(message);
    await putKVValue("validMessages", JSON.stringify(validMessages));

    // Remove the message after 10 minutes
    setTimeout(async () => {
      let updatedValidMessages = await getKVValue("validMessages");
      updatedValidMessages = JSON.parse(updatedValidMessages || "[]");
      const index = updatedValidMessages.indexOf(message);
      if (index > -1) {
        updatedValidMessages.splice(index, 1);
        await putKVValue("validMessages", JSON.stringify(updatedValidMessages));
      }
    }, 10 * 60 * 1000);
  } catch (error) {
    console.error("Error adding valid message:", error);
  }
}

async function isValidMessage(message) {
  try {
    const validMessages = await getKVValue("validMessages");
    return JSON.parse(validMessages || "[]").includes(message);
  } catch (error) {
    console.error("Error checking valid message:", error);
    return false;
  }
}

const existingMessages = new Set(); // Set to track existing messages

function isSuperchatFormat(message) {
  // The exact bold 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 text in Unicode
  const exactBoldText = "𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧";
  const exactLightningBolts = "⚡⚡";

  // Validate the exact format character by character
  const regex = new RegExp(`^${exactLightningBolts}\\s${exactBoldText}\\s\\[(\\d+(?:\\.\\d+)?)\\sAPTO\\]:\\s.+$`);

  // Basic format check
  if (!regex.test(message)) {
    return false;
  }

  // Check for duplicate messages
  if (existingMessages.has(message)) {
    return false; // Message is a duplicate
  } else {
    existingMessages.add(message); // Add new message to the set
  }

  // Additional security checks
  const parts = message.split(": ");
  if (parts.length !== 2) return false;

  const [header, content] = parts;

  // Check the header structure
  const headerParts = header.split(" [");
  if (headerParts.length !== 2) return false;

  // The first part should be "⚡⚡ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧"
  const [prefixPart, amountPart] = headerParts;
  const [lightningEmojis, superChat] = prefixPart.split(" ");

  // Verify exact lightning emoji pattern
  if (lightningEmojis !== exactLightningBolts) return false;

  // Verify exact 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 text
  if (superChat !== exactBoldText) return false;

  // Verify amount format
  if (!amountPart.endsWith(" APTO]")) return false;

  // Extract and validate amount
  const amount = amountPart.slice(0, -6); // Remove ' APTO]'
  if (!/^\d+(?:\.\d+)?$/.test(amount)) return false;

  // Verify the amount is a valid number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return false;

  // Message content should not be empty
  if (content.trim().length === 0) return false;

  // Ensure the message is not in lowercase
  if (/[a-z]/.test(content)) return false; // Check for lowercase in the content

  // Additional checks for common spoofing attempts
  const lightningCount = [...message].filter((char) => char === "⚡").length;
  if (lightningCount !== 2) return false;

  // Check for multiple occurrences of SUPERCHAT/APTO
  if ((message.match(/superchat/gi) || []).length > 1) return false;
  if ((message.match(/apto/gi) || []).length > 1) return false;

  // Success - message passed all validation checks
  return true;
}

module.exports = { addValidMessage, isValidMessage, isSuperchatFormat };