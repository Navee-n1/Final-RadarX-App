import os
import re
import spacy
from nltk.corpus import stopwords
 
nlp = spacy.load("en_core_web_sm")
stop_words = set(stopwords.words("english"))
 
NOISE_WORDS = {"team", "project", "solution", "experience", "technologies", "development", "ability"}
 
def extract_skills(text):
    import re
 
    # Sample skill whitelist – add or expand as needed
    SKILL_WHITELIST = {
        'python', 'java', 'sql', 'html', 'css', 'react', 'node.js', 'node', 'aws', 'azure', 'docker',
        'kubernetes', 'mongodb', 'linux', 'flask', 'django', 'c++', 'c#', 'git', 'github',
        'spring', 'angular', 'typescript', 'data analysis', 'pandas', 'numpy', 'machine learning',
        'nlp', 'excel', 'power bi', 'tableau', 'api', 'rest', 'graphql'
    }
 
    # Extract potential skill-like words using basic regex
    words = re.findall(r'\b[a-zA-Z+#.]{2,20}\b', text)
 
    cleaned = set()
    for word in words:
        w = word.lower()
        if w in SKILL_WHITELIST:
            cleaned.add(w)
 
    return list(cleaned)
 
# ⬇️ Add these for matching APIs (DO NOT REMOVE ABOVE)
 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
 
def extract_text(file):
    if isinstance(file, str):
        # It's a DB-stored relative file path, convert it to full absolute path
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', file))
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"❌ File not found: {file_path}")
        with open(file_path, 'rb') as f:
            return f.read().decode('utf-8', errors='ignore')
    else:
        # It's a FileStorage object from request.files
        return file.read().decode('utf-8', errors='ignore')
 
 
def compute_similarity_score(text1, text2):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    return cosine_similarity(vectors[0], vectors[1])[0][0]
 
def get_label(score):
    if score >= 0.75:
        return "Excellent Match"
    elif score >= 0.5:
        return "Good Match"
    elif score >= 0.3:
        return "Moderate Match"
    else:
        return "Low Match"
 
def generate_explanation(jd_text, resume_text):
    jd_words = set(jd_text.lower().split())
    resume_words = set(resume_text.lower().split())
    matched = jd_words.intersection(resume_words)
    return f"Matched keywords: {', '.join(list(matched)[:10])}"
def extract_experience(text):
    """
    Extracts number of years of experience from the JD text.
    Returns an integer like 1, 2, 3... or 0 if not found.
    """
    match = re.search(r'(\d+)\+?\s*(years|yrs).*experience', text.lower())
    return int(match.group(1)) if match else 0