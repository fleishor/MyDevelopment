import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Missing OPENAI_API_KEY in .env")

client = OpenAI(api_key=api_key)

response = client.chat.completions.create(
    model="gpt-6-luna",
    messages=[{
        "role": "user", 
        "content": "wer ist der derzeitige Bundeskanzler von Deutschland?"
        }],
     reasoning_effort="none"
    )

print(response.model_dump_json(indent=2))
