import os
from sentence_transformers import SentenceTransformer, util
from utils.parser import extract_text
from utils.skill_extractor import extract_skills
from utils.explainer import generate_explanation
from models import Resume, JD, MatchResult, db

model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_similarity_score(jd_text, resume_text):
    jd_emb = model.encode(jd_text, convert_to_tensor=True)
    resume_emb = model.encode(resume_text, convert_to_tensor=True)
    score = util.cos_sim(jd_emb, resume_emb).item()
    return score

def detect_domain(text):
    domains = ['banking', 'healthcare', 'ecommerce', 'automotive', 'insurance', 'retail']
    text = text.lower()
    for domain in domains:
        if domain in text:
            return domain
    return None

def get_label(score):
    if score >= 0.85:
        return "✅ Highly Recommended"
    elif score >= 0.70:
        return "☑️ Recommended"
    elif score >= 0.50:
        return "🟡 Decent – Can Explore"
    else:
        return "🔴 Not Recommended"

def run_batch_match(jd_id):
    jd = JD.query.get(jd_id)
    if not jd:
        return []

    jd_text = extract_text(jd.file_path)
    jd_skills = extract_skills(jd_text)
    jd_domain = detect_domain(jd_text)

    top_matches = []
    resumes = Resume.query.all()

    for resume in resumes:
        resume_text = extract_text(resume.file_path)
        resume_skills = extract_skills(resume_text)

        # Optional skill overlap filter
        if len(set(jd_skills) & set(resume_skills)) < 1:
            continue

        score = compute_similarity_score(jd_text, resume_text)
        if jd_domain and jd_domain in resume_text.lower():
            score += 0.05

        explanation = generate_explanation(jd_text, resume_text)
        label = get_label(score)

        # Save match
        match = MatchResult(
            jd_id=jd.id,
            resume_id=resume.id,
            score=score,
            explanation=str(explanation)
        )
        db.session.add(match)

        top_matches.append({
            "resume_id": resume.id,
            "file": os.path.basename(resume.file_path),
            "file_path": resume.file_path,
            "score": round(score, 2),
            "label": label,
            "explanation": explanation
        })

    db.session.commit()
    top_matches.sort(key=lambda x: x["score"], reverse=True)
    return top_matches[:3]

def run_one_to_one_match(jd_text, resume_text):
    score = compute_similarity_score(jd_text, resume_text)
    return {
        "score": round(score, 2),
        "label": get_label(score),
        "explanation": generate_explanation(jd_text, resume_text)
    }
