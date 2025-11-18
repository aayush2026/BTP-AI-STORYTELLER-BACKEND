from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import assemblyai as aai
import boto3
import os
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from jiwer import wer
import string
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from difflib import ndiff

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://btp-ai-storyteller-frontend.vercel.app/"
    ], 
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

# S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")
CDN_BASE_URL = os.getenv("CDN_BASE_URL")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

def generate_presigned_s3_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate the URL AssemblyAI will use to fetch the audio.
    Prefer CDN (CloudFront) if configured, otherwise use S3 pre-signed URL.
    """
    if not key:
        raise ValueError("S3 key is required to generate audio URL")

    if CDN_BASE_URL:
        base = CDN_BASE_URL.rstrip("/")
        path = key.lstrip("/")
        return f"{base}/{path}"  # https://dxxxx.cloudfront.net/uploads/audio/...

    # Fallback: S3 pre-signed GET URL
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )

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
        # NEW: prefer S3 key if present, fallback to legacy filePath
        s3_key = audio_document.get("s3Key")
        file_path = audio_document.get("filePath")
        
        # Generate pre-signed URL for S3 if key exists
        if s3_key:
            audio_file_url = generate_presigned_s3_url(s3_key)
        elif file_path:
            audio_file_url = file_path
        else:
            raise HTTPException(
                status_code=400,
                detail="No audio location found (missing s3Key and filePath)",
            )

        story = audio_document["wholeStory"]

        print("Audio File URL:", audio_file_url)

        score = None
        if story:
            scorer = Scorer(story, audio_file_url)  # URL now points to S3
            transcript = scorer.true_transcript
            print("Transcript1:", transcript)
            audios_collection.update_one(
                {"_id": ObjectId(audio_id)}, {"$set": {"transcript": transcript}}
            )
            enhanced_transcript = scorer.enhanced_trancript
            score = scorer.finalScore()
            audios_collection.update_one(
                {"_id": ObjectId(audio_id)}, {"$set": {"score": score}}
            )
        else:
            print("Error: story is empty or missing")
            enhanced_transcript = None
            transcript = None

        return {
            "transcript": transcript,
            "enhanced_transcript": enhanced_transcript if story else None,
            "score": score,
        }
    else:
        print("No audio document found with the specified criteria.")
        raise HTTPException(status_code=404, detail="Audio not found")


if __name__=="__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=8000)

# story ="Once upon a time, there was a curious boy named Aarav who had always dreamt of visiting the bustling city of Mumbai. His wish finally came true when his parents decided to take him on a trip to the vibrant city. As the plane descended towards the airport, Aarav's eyes widened with excitement as he caught a glimpse of the sprawling metropolis below. Stepping out of the airport, Aarav felt the warm Mumbai breeze brush against his face, filled with anticipation for the adventures that lay ahead "
# file_path = 'aayush.wav'

# scorer =Scorer(story,file_path)

# print(scorer.finalScore())
# print(scorer.puntuationAnalysis())