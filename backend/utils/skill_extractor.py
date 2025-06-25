import re
import spacy
from nltk.corpus import stopwords

nlp = spacy.load("en_core_web_sm")
stop_words = set(stopwords.words("english"))

# Optional: Words we don’t want as skills
NOISE_WORDS = {"team", "project", "solution", "experience", "technologies", "development", "ability"}

def extract_skills(text):
    doc = nlp(text)
    tokens = [token.text.lower() for token in doc if not token.is_punct and not token.is_space]
    
    # Phase 1: Extract noun chunks (likely skill phrases)
    skill_phrases = set()
    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip().lower()
        if (
            1 < len(phrase) < 50
            and not any(word in stop_words for word in phrase.split())
            and not any(n in NOISE_WORDS for n in phrase.split())
        ):
            skill_phrases.add(phrase)

    # Phase 2: Regex tech filters (common formats like React.js, C++, etc.)
    tech_keywords = set()
    for token in tokens:
        if re.match(r'^[a-zA-Z0-9+#.-]{2,}$', token):
            if token not in stop_words and len(token) > 2:
                tech_keywords.add(token)

    # Combine and return structured
    combined = skill_phrases.union(tech_keywords)
    return sorted(combined)
