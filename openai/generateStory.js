import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();
export async function generateStory({
  storyDescription,
  storyTitle,
  maxPages,
  childAge,
}) {
  const openai = new OpenAI(process.env.OPENAI_API_KEY);

  const systemPrompt = `You are a helpful and creative assistant designed to generate engaging and age-appropriate stories for children. Your stories should be fun, imaginative, and suitable for the given age group, ensuring they are both entertaining and educational.`;

  const userPrompt = `Generate a story for a child of age ${childAge} with the following details:
  - Story Title: "${storyTitle}"
  - Story Description: "${storyDescription}"
  - The story should contain a maximum of ${maxPages} pages.
  - Each page should have a "pageText" field containing a portion of the story.
  - Each page should have a minimum of 250 words.
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
  
  Ensure that the story is age-appropriate for a child of age ${childAge}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const storyContent = response.choices[0].message.content;

    // If the response is in JSON format, parse it
    try {
      return JSON.parse(storyContent);
    } catch (err) {
      return storyContent; // Return as plain text if JSON parsing fails
    }
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to generate story");
  }
}
