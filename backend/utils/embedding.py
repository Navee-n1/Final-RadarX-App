from sentence_transformers import SentenceTransformer
import json

# Load the model once
model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embedding(text):
    """
    Generate JSON-serializable embedding for a given text.
    """
    if not text or len(text.strip()) == 0:
        return None
    embedding = model.encode(text).tolist()  # Convert to list so it can be stored as JSON
    return json.dumps(embedding)
