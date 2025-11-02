import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

export async function generateImage({ pageText }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Create the system prompt
  const shortSystemPrompt = `You are an AI assistant designed to generate images for children's stories. Focus on extracting key points from long text and use these to generate simple, child-friendly, imaginative images. Ensure images align with the age group and story's tone.`;

  // Create the user prompt
  const shortUserPrompt = `Extract key visual elements not more than 30 words or two short sentences from this story content: ${pageText}. Focus on the most important details in sequence. Ensure the image is vivid, imaginative, and age-appropriate, capturing the key scene and emotions.`;

  let finalPrompt;

  try {
    // Get the final prompt from GPT
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: shortSystemPrompt,
        },
        {
          role: "user",
          content: shortUserPrompt,
        },
      ],
    });

    // Retrieve and format the final prompt
    finalPrompt = chatResponse.choices[0].message.content.replace(/\n/g, " ");
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }

  try {
    // Generate the image based on the final prompt
    const imageResponse = await openai.images.generate({
      prompt: finalPrompt,
      model: "dall-e-3",
      n: 1, // generate 1 image
      response_format: "url", // get the image URL
      style: "vivid",
      quality: "standard",
      size: "1024x1024",
    });

    // Access the correct structure of the response
    if (imageResponse.data && imageResponse.data.length > 0) {
      return imageResponse.data[0].url; // Return the first URL from the response
    } else {
      console.error("No image URL returned in response in generateImage");
      return null;
    }
  } catch (error) {
    console.error("Error generating image in generateImage:", error);
    return {
      error: "Failed to generate image",
      details: error.message,
    };
  }
}
