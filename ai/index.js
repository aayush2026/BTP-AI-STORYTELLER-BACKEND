import dotenv from "dotenv";
dotenv.config();

// Import both providers
import * as openai from "../openai/index.js";
import * as gemini from "../gemini/index.js";

// Get the provider from environment variable (default to "openai")
const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

// Select the implementation based on provider
const impl = provider === "gemini" ? gemini : openai;

// Export the functions from the selected provider
export const generateStory = impl.generateStory;
export const generateQuestions = impl.generateQuestions;
export const generateFeedback = impl.generateFeedback;
export const generateImage = impl.generateImage;

// Log which provider is being used (helpful for debugging)
console.log(`✅ Using AI Provider: ${provider.toUpperCase()}`);

