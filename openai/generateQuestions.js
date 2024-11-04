import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

export async function generateQuestions({ storyContent, storyTitle }) {
  const openai = new OpenAI(process.env.OPENAI_API_KEY);
  const wholeStory = storyContent?.map((page) => page.pageText).join(" ");

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
  Ensure that the JSON is valid, properly formatted, and contains no additional commentary or explanations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    const questionsText = response.choices[0].message.content;

    // Sanitize the response text if needed
    const sanitizedText = questionsText.trim().replace(/[\r\n]+/g, "");

    // Attempt to parse response
    let questions;
    try {
      questions = JSON.parse(sanitizedText);
    } catch (parseError) {
      console.error("JSON parse error:", sanitizedText);
      return {
        error: "Failed to parse response",
        rawResponse: sanitizedText,
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
