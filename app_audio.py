from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import assemblyai as aai
from jiwer import wer
import os
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
import string
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from difflib import ndiff

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add the frontend URL here
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Load environment variables
load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
aai.settings.api_key=os.getenv("ASSEMBLY_AI_API_KEY")
client = MongoClient(os.getenv("MONGODB_URI"))

db = client["test"]
audios_collection = db["audios"]

""" audio_id = ObjectId("672a50d20f0a5a829a05cbcc") 
audio_document = audios_collection.find_one({"_id": audio_id}) """

def transcribe(audio_file_url:str):         # Transcribes the audio file and ususlly retains 90% of the details of the data.
    transcriber = aai.Transcriber()
    config = aai.TranscriptionConfig()
    transcript = transcriber.transcribe(audio_file_url,config=config)
    return transcript.text

def enhance_the_transcript(transcript,story):    # Generates the best possible transcript given the words detected
    client = OpenAI()

    completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are the most important part of word error calculator. You will be given two strings 'content' and 'context'. Context is the corrected expected string and content is the sentence or paragraph spoken by the speaker.Your job is to replace the incorrect or out of context words in the content string with the corrected spelling or within context words in the context string. Your job is not to return the final corrected string, just make necessary changes in the content string and output it, not even a word(or character) extra. You don't have to add words or mess with the punctuation, just correct them"
                },
                {
                    "role": "user",
                    "content":f"content: {transcript} context: {story}"
                }
            ]
        )
    return completion.choices[0].message.content


class Scorer:
    def __init__(self,story,audio_file_url,language='en'):
        self.story=story
        self.audio_file_url=audio_file_url
        self.language=language
        self.true_transcript= transcribe(audio_file_url)
        self.enhanced_trancript=enhance_the_transcript(self.true_transcript,self.story)

    def WER(self):
        wer1 = wer(self.story,self.true_transcript)                  #This is the error generated is between the transcript and the true story
        wer2 = wer(self.enhanced_trancript,self.story)               # This is the error generated is between the corrected words and the true story
        wer3 = wer(self.enhanced_trancript,self.true_transcript)                  #This represents the similaritiy between the best possible transcript and the given transcript lower, more similar 
        
        # print(wer1,wer2,wer3,completion.choices[0].message.content,sep='\n')
        
        return (1-wer3)*wer1 + wer3*wer2                       
    
    def finalScore(self):
        return 100-100*self.WER() 
    
    def puntuationAnalysis(self):
        transcript_sentences = sent_tokenize(self.true_transcript)
        story_sentences = sent_tokenize(self.story)

        # Check if sentence counts match
        if len(transcript_sentences) != len(story_sentences):
            print(f"Mismatch in sentence count: Transcript ({len(transcript_sentences)}) vs Story ({len(story_sentences)})")

        # Analyze punctuation in each sentence
        differences = []
        for i, (transcript_sentence, story_sentence) in enumerate(zip(transcript_sentences, story_sentences)):
            transcript_words = word_tokenize(transcript_sentence)
            story_words = word_tokenize(story_sentence)

            # Compare punctuation in each sentence
            transcript_punctuation = [w for w in transcript_words if w in string.punctuation]
            story_punctuation = [w for w in story_words if w in string.punctuation]

            if transcript_punctuation != story_punctuation:
                differences.append({
                    'sentence_index': i,
                    'transcript_punctuation': transcript_punctuation,
                    'story_punctuation': story_punctuation
                })

        return differences
    
    def transcribe(self):
        return self.true_transcript
    
    def enhance_the_transcript(self):
        return self.enhanced_trancript
    
#####################
def highlight_differences(original_text, your_reading):
    # Generate the differences
    diff = ndiff(original_text.split(), your_reading.split())

    # Highlight the differences
    highlighted_text = []
    for word in diff:
        if word.startswith("- "):  # Word in original but missing in reading
            highlighted_text.append(f'<span class="bg-red-200 text-red-700 px-1 rounded">{word[2:]}</span>')
        elif word.startswith("+ "):  # Extra word in reading
            highlighted_text.append(f'<span class="bg-green-200 text-green-700 px-1 rounded">{word[2:]}</span>')
        else:
            highlighted_text.append(word[2:])  # No difference

    # Join the list into a single string and return
    return ' '.join(highlighted_text)

######################

@app.get("/process-audio/{audio_id}")
async def process_audio(audio_id:str):
    audio_document = audios_collection.find_one({"_id": ObjectId(audio_id)})
    if audio_document:
        audio_file_url = audio_document["filePath"]
        story = audio_document["wholeStory"]

        print("Audio File Path:", audio_file_url)

        score=None
        if story:
            #print("Enhanced Transcript:", enhanced_transcript)
            scorer = Scorer(story, audio_file_url)  # Initialize scorer with story and audio URL
            transcript = scorer.true_transcript
            print("Transcript1:", transcript)
            audios_collection.update_one({"_id": ObjectId(audio_id)}, {"$set": {"transcript": transcript}})
            enhanced_transcript = scorer.enhanced_trancript
            score = scorer.finalScore()
            audios_collection.update_one({"_id": ObjectId(audio_id)}, {"$set": {"score": score}})
        else:
            print("Error")

        return{
            "transcript": transcript,
            "enhanced_transcript": enhanced_transcript if story else None,
            "score": score
        }
    else:
        print("No audio document found with the specified criteria.")
if __name__=="__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=8000)

# story ="Once upon a time, there was a curious boy named Aarav who had always dreamt of visiting the bustling city of Mumbai. His wish finally came true when his parents decided to take him on a trip to the vibrant city. As the plane descended towards the airport, Aarav's eyes widened with excitement as he caught a glimpse of the sprawling metropolis below. Stepping out of the airport, Aarav felt the warm Mumbai breeze brush against his face, filled with anticipation for the adventures that lay ahead "
# file_path = 'aayush.wav'

# scorer =Scorer(story,file_path)

# print(scorer.finalScore())
# print(scorer.puntuationAnalysis())