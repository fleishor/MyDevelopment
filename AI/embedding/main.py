import os
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "text-embedding-3-small")
DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", 1536))

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

karlBerlinSoftwareentwickler = "Karl wohnt in Berlin und arbeitet als Softwareentwickler."
karlBerlinSoftwareentwicklerResponse = client.embeddings.create(
    model=MODEL,
    input=karlBerlinSoftwareentwickler,
    dimensions=DIMENSIONS
)

annaHamburgDesigner = "Anna wohnt in Hamburg und arbeitet als Designer."
annaHamburgDesignerResponse = client.embeddings.create(
    model=MODEL,
    input=annaHamburgDesigner,
    dimensions=DIMENSIONS
)

karlBerlinDesigner = "Karl wohnt in Berlin und arbeitet als Designer."
karlBerlinDesignerResponse = client.embeddings.create(
    model=MODEL,
    input=karlBerlinDesigner,
    dimensions=DIMENSIONS
)

frage = "Wer wohnt in Berlin und arbeitet als Softwareentwickler?"
frageResponse = client.embeddings.create(
    model=MODEL,
    input=frage,
    dimensions=DIMENSIONS
)

karlBerlinSoftwareentwicklerEmbedding = np.array(karlBerlinSoftwareentwicklerResponse.data[0].embedding)
annaHamburgDesignerEmbedding = np.array(annaHamburgDesignerResponse.data[0].embedding)
karlBerlinDesignerEmbedding = np.array(karlBerlinDesignerResponse.data[0].embedding)
frageEmbedding = np.array(frageResponse.data[0].embedding)


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


similarity1 = cosine_similarity(karlBerlinSoftwareentwicklerEmbedding, frageEmbedding)
similarity2 = cosine_similarity(annaHamburgDesignerEmbedding, frageEmbedding)
similarity3 = cosine_similarity(karlBerlinDesignerEmbedding, frageEmbedding)    

print(f"Ähnlichkeit mit karlBerlinSoftwareentwicklerEmbedding (Karl, Berlin, Softwareentwickler): {similarity1:.4f}")
print(f"Ähnlichkeit mit karlBerlinDesignerEmbedding (Karl, Berlin, Designer): {similarity3:.4f}")
print(f"Ähnlichkeit mit annaHamburgDesignerEmbedding (Anna, Hamburg, Designer): {similarity2:.4f}") 
