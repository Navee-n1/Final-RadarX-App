import os
import re
import spacy
from nltk.corpus import stopwords
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load Spacy model and NLTK stopwords once
nlp = spacy.load("en_core_web_sm")
stop_words = set(stopwords.words("english"))

# Whitelist skills and their categories
SKILL_WHITELIST = {
    'python', 'java', 'c++', 'c#', 'html', 'css', 'javascript', 'typescript', 'sql',
    'react', 'node.js', 'angular', 'flask', 'django', 'spring', 'next.js',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'linux',
    'power bi', 'tableau', 'pandas', 'numpy', 'matplotlib',
    'git', 'github', 'bitbucket',
    'api', 'rest', 'graphql', 'nlp', 'machine learning', 'deep learning'
}

CATEGORY_MAP = {
    'Languages': {'python', 'java', 'c++', 'c#', 'html', 'css', 'javascript', 'typescript', 'sql'},
    'Frameworks': {'react', 'angular', 'flask', 'django', 'spring', 'next.js'},
    'Cloud/DevOps': {'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'linux'},
    'Tools': {'git', 'github', 'bitbucket'},
    'Data/Analytics': {'power bi', 'tableau', 'pandas', 'numpy', 'matplotlib'},
    'AI/ML': {'nlp', 'machine learning', 'deep learning'},
    'APIs': {'api', 'rest', 'graphql'},
}

NOISE_WORDS = {"team", "project", "solution", "experience", "technologies", "development", "ability", "skill"}


# ──────────────────────────────
# Tokenize and clean text input
# ──────────────────────────────
def clean_tokens(text):
    words = re.findall(r'\b[a-zA-Z0-9+#.]{2,20}\b', text)
    cleaned = [w.lower() for w in words if w.lower() not in stop_words and w.lower() not in NOISE_WORDS]
    return cleaned


# ──────────────────────────────
# Extract skills from text using whitelist & n-grams
# ──────────────────────────────
def extract_skills(text):
    tokens = clean_tokens(text)
    text_lower = text.lower()
    found = set()

    # Match whitelist skills directly in text (full text match)
    for skill in SKILL_WHITELIST:
        if skill in text_lower:
            found.add(skill)

    # Check bigrams (2-word sequences) for multi-word skills
    bigrams = [' '.join(tokens[i:i+2]) for i in range(len(tokens) - 1)]
    for bg in bigrams:
        if bg in SKILL_WHITELIST:
            found.add(bg)

    return sorted(found)


# ──────────────────────────────
# Group extracted skills by category, fallback to Others
# ──────────────────────────────
def categorize_skills(skills):
    grouped = defaultdict(list)
    for skill in skills:
        placed = False
        for category, items in CATEGORY_MAP.items():
            if skill in items:
                grouped[category].append(skill)
                placed = True
                break
        if not placed:
            grouped["Others"].append(skill)
    return dict(grouped)


# ──────────────────────────────
# Compute TF-IDF cosine similarity score between two texts
# ──────────────────────────────
def compute_similarity_score(text1, text2):
    try:
        vectorizer = TfidfVectorizer().fit([text1, text2])
        tfidf_matrix = vectorizer.transform([text1, text2])
        score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        return score
    except Exception as e:
        # Optional: log error if you have a logger
        # logger.error(f"Similarity scoring failed: {e}")
        return 0.0
