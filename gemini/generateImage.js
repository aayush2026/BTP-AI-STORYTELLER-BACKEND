import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generate an image from story text using Gemini's native image generation
 * Uses gemini-2.5-flash-image model for text-to-image generation
 * @param {Object} options - Generation options
 * @param {string} options.pageText - The story text to generate an image from
 * @param {string} options.aspectRatio - Optional aspect ratio (default: "1:1")
 * @returns {Promise<string|null>} - Data URL string or null if generation fails
 */
export async function generateImage({ pageText, aspectRatio = "16:9" }) {
  try {
    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Create a child-friendly, visual prompt from the story text
    // Extract key visual elements and make it concise
    const prompt = `Create a vivid, child-friendly illustration for this story passage. Make it colorful, imaginative, and age-appropriate:\n\n${pageText}`;

    // Generate image using Gemini's image generation model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // Options: "1:1", "16:9", "4:3", "2:3", "3:2", etc.
        },
      },
    });

    // Extract the image from the response
    // Response contains parts with either text or inlineData
    const parts = response?.candidates?.[0]?.content?.parts || [];
    
    // Find the first part that contains image data
    const imagePart = parts.find((part) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      console.error("No image data found in Gemini response");
      console.log("Response structure:", JSON.stringify(response, null, 2));
      return null;
    }

    // Get the image data and MIME type
    // The data is already base64 encoded according to Gemini API docs
    const base64ImageData = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    // Convert to data URL format that Cloudinary can accept
    // Cloudinary's uploader.upload() accepts data URLs directly
    const dataUrl = `data:${mimeType};base64,${base64ImageData}`;

    console.log(`✅ Gemini image generated successfully (${mimeType})`);
    return dataUrl;
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    return null;
  }
}
