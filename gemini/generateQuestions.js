import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateQuestions({ storyContent, storyTitle }) {
  // Validate input
  if (!storyContent || !Array.isArray(storyContent) || storyContent.length === 0) {
    console.error("Invalid storyContent provided:", storyContent);
    return {
      error: "Invalid story content",
      details: "Story content is required and must be an array",
    };
  }

  if (!storyTitle || typeof storyTitle !== "string") {
    console.error("Invalid storyTitle provided:", storyTitle);
    return {
      error: "Invalid story title",
      details: "Story title is required",
    };
  }

  const wholeStory = storyContent.map((page) => page?.pageText || "").filter(Boolean).join(" ");
  
  if (!wholeStory || wholeStory.trim().length === 0) {
    console.error("No story text found in storyContent");
    return {
      error: "Empty story content",
      details: "No valid page text found in story content",
    };
  }

  const systemPrompt = `You are a helpful and creative assistant designed to generate engaging and age-appropriate questions for children. Your questions should be fun, imaginative, and suitable for the given story, ensuring they are both entertaining and educational.`;

  const userPrompt = `Generate questions and answers for the story "${storyTitle}" with the story content: \n\n${wholeStory}.
  The output should be strictly in JSON format with the following structure:
  {
   
    "questions": [
      {
        "question": "The question you want to ask",
        "answer": "The correct answer which you think is right",
        "userAnswer": "The answer given by the user(You must leave this empty)"
        
      }
      // Continue up to 5 questions in similar structure
    ]
  }
  Ensure that the JSON is valid, properly formatted, and contains no additional commentary or explanations.
  IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no additional text.`;

  try {
    // Combine system and user prompts for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const questionsText = response.text();

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = questionsText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n?/g, "").replace(/```\s*$/g, "").trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\w*\n?/g, "").replace(/```\s*$/g, "").trim();
    }

    // Try to find JSON object in the response (in case there's extra text)
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // Attempt to parse response
    let questions;
    try {
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Attempted to parse:", cleanedText.substring(0, 500));
      return {
        error: "Failed to parse response",
        rawResponse: cleanedText.substring(0, 1000), // Limit to first 1000 chars for logging
      };
    }

    // Validate the structure
    if (!questions || typeof questions !== "object") {
      console.error("Invalid questions structure:", questions);
      return {
        error: "Invalid response structure",
        rawResponse: cleanedText.substring(0, 1000),
      };
    }

    return questions; // Return the parsed object directly
  } catch (error) {
    console.error("Error generating questions:", error);
    return {
      error: "Error generating questions",
      details: error.message,
    };
  }
}
