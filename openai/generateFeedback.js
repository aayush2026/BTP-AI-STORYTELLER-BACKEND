import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

export async function generateFeedback({ questions, storyContent }) {

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const wholeStory = storyContent?.map((page) => page.pageText).join(" ");
  
  const systemPrompt = `You are a supportive reading assistant focused on enhancing children’s reading comprehension. 
  You will be given the full story, the question, the child’s answer, 
  and the correct answer. Use this information to compare the child’s response with the correct answer and assess their understanding. 
  Provide constructive and encouraging feedback that highlights key areas for improvement, 
  helping the child connect with important details and themes in the story. Offer a rating to indicate their comprehension level, and keep the feedback positive and motivating to foster a love for reading.`;

  const userPrompt = `Evaluate the user’s responses to the following questions based on the provided story. The data includes a detailed narrative (the story), a series of questions related to the story, the correct answers to each question, and the user’s responses, which have been converted from spoken responses to text. For each question, compare the user’s answer with the correct answer, focusing on how accurately, relevantly, and clearly the user has addressed the question. Please provide feedback on how well the user's response aligns with the correct answer, noting any areas where understanding, clarity, or detail could be improved. Suggest specific adjustments or corrections if needed to help the user refine their responses.
For each question, provide:
1. A rating out of 5 based on how accurately the user's answer shows understanding of the story.
2. Constructive feedback that helps the child improve their comprehension skills. Highlight key areas they might have missed, offer gentle guidance on how to connect details in the story, and encourage them to think about the story’s main ideas and themes.
3. Positive reinforcement to keep the child motivated and help them enjoy the process of learning to read with understanding.

**Output the results in strict JSON format** as shown in the example below.

**Example Output Format:**

{
  "results": [
    {
      "question": "Question text here",
      "rating": 4,
      "answer": "Correct answer here",
      "userAnswer": "User's answer here",
      "feedback": "Feedback text here. For example, 'Remember to look for clues in the story that explain why a character did something.'",
      "positiveReinforcement": "Great effort! Keep looking for those story clues – you're doing well!"
    },
    {
      "question": "Question text here",
      "rating": 3,
        "answer": "Correct answer here",
        "userAnswer": "User's answer here",
      "feedback": "Feedback text here. For instance, 'Try to focus on how the characters felt during this event to understand it better.'",
      "positiveReinforcement": "Good job! You're getting better at finding the important parts of the story."
    }
    // Additional questions here up to 5 total
  ]
}


**Now, please evaluate the following:**

Full Story:
"${wholeStory}"

Questions and Answers:

1. Question: "${questions[0].question}"
   - Correct Answer: "${questions[0].answer}"
   - User's Answer: "${questions[0].userAnswer}"
   
2. Question: "${questions[1].question}"
   - Correct Answer: "${questions[1].answer}"
   - User's Answer: "${questions[1].userAnswer}"
   
3. Question: "${questions[2].question}"
   - Correct Answer: "${questions[2].answer}"
   - User's Answer: "${questions[2].userAnswer}"
   
4. Question: "${questions[3].question}"
   - Correct Answer: "${questions[3].answer}"
   - User's Answer: "${questions[3].userAnswer}"
   
5. Question: "${questions[4].question}"
   - Correct Answer: "${questions[4].answer}"
   - User's Answer: "${questions[4].userAnswer}"

Please return the feedback and rating for each question in the exact JSON format as demonstrated in the example. Remember to keep the feedback child-friendly and focused on helping them build reading comprehension skills.`;

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

  const data = response.choices[0].message.content;
  const sanitizedData = data.trim().replace(/[\r\n]+/g, "");
  
  try {
    const feedback = JSON.parse(sanitizedData);
    return feedback;
  } catch (error) {
    console.error("JSON parse error:", sanitizedData);
    return {
      error: "Failed to parse response",
      rawResponse: sanitizedData,
    };
  }
}
