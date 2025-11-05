import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateStory({
  storyDescription,
  storyTitle,
  maxPages,
  childAge,
}) {
  // This prompt is used to guide the AI in generating the story
  const systemPrompt = `You are a helpful and creative assistant designed to generate engaging and age-appropriate stories for children. Your stories should be fun, imaginative, and suitable for the given age group, ensuring they are both entertaining and educational.`;

  // This prompt is used to generate the story
  const userPrompt = `Generate a story for a child of age ${childAge} with the following details:
  - Story Title: "${storyTitle}"
  - Story Description: "${storyDescription}"
  - The story should contain a maximum of ${maxPages} pages.
  - Each page should have a "pageText" field containing a portion of the story.
  - Each page should have a minimum of 150 words and max of 300 words.
  - The response should follow this format: 
  
  {
    "storyTitle": "${storyTitle}",
    "storyDescription": "${storyDescription}",
    "storyContent": [
      {
        "pageText": "Text for page 1"
      },
      {
        "pageText": "Text for page 2"
      }
      // Continue up to ${maxPages}  number of pages
    ]
  }
  
  Ensure that the story is age-appropriate for a child of age ${childAge}.
  IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no additional text.`;

  try {
    // Combine system and user prompts for Gemini (Gemini doesn't have separate system messages in the same way)
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const storyContent = response.text();

    // Clean up the response - remove markdown code blocks if present
    let cleanedContent = storyContent.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/```\n?/g, "").trim();
    }

    // If the response is in JSON format, parse it
    try {
      return JSON.parse(cleanedContent);
    } catch (err) {
      console.error("JSON parse error:", cleanedContent);
      return {
        error: "Failed to parse story response",
        details: err.message,
        rawResponse: cleanedContent,
      };
    }
  } catch (error) {
    console.error("Error generating story:", error);
    return {
      error: "Failed to generate story",
      details: error.message,
    };
  }
}
