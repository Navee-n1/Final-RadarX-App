import re
import cohere
from sentence_transformers import SentenceTransformer, util
from utils.skill_extractor import extract_skills, categorize_skills
from utils.parser import extract_experience
from utils.utils import log_agent_error
from models import Config
from flask import current_app as app


model = SentenceTransformer('all-MiniLM-L6-v2')
MAX_SUMMARY_CHARS = 2000  # To avoid DB issues


def semantic_skill_score(jd_skills, resume_skills, threshold=0.5):
    if not jd_skills or not resume_skills:
        return [], 0.0
    jd_emb = model.encode(jd_skills, convert_to_tensor=True)
    res_emb = model.encode(resume_skills, convert_to_tensor=True)

    matched = []
    used_resume_indices = set()
    for i, jd_vec in enumerate(jd_emb):
        scores = util.pytorch_cos_sim(jd_vec, res_emb)[0]
        sorted_scores = [(j, float(score)) for j, score in enumerate(scores)]
        for j, score in sorted(sorted_scores, key=lambda x: x[1], reverse=True):
            if score >= threshold and j not in used_resume_indices:
                matched.append((jd_skills[i], resume_skills[j], round(score, 2)))
                used_resume_indices.add(j)
                break
    ratio = len(matched) / max(len(jd_skills), 1)
    return matched, round(ratio, 2)




def extract_sentences_with_keywords(text, keywords):
    lines = text.split('\n')
    found = []
    for line in lines:
        l = line.lower()
        if any(k in l for k in keywords):
            clean = re.sub(
                r"(email:\s*[\w\.-]+@[\w\.-]+\.\w+)|"               # Email label + email
                r"(phone:\s*(\+?\d[\d\s\-\(\)]{7,}\d))|"             # Phone label + phone number
                r"(github:\s*(https?://)?(www\.)?github\.com/\S+)|"  # GitHub label + URL
                r"(https?://(www\.)?github\.com/\S+)|"               # GitHub URLs without label
                r"\b[\w\.-]+@[\w\.-]+\.\w+\b|"                        # standalone emails
                r"(\+?\d{1,2}[\s\-]?)?(\(?\d{3}\)?[\s\.\-]?\d{3}[\s\.\-]?\d{4})",  # standalone phones
                "", line, flags=re.I
            )
            # Remove bullets, stars, dots, numbered list markers at start of line
            clean = re.sub(r"^\s*(?:[\-\*\•]|(\d+)[\.\)\-])\s*", "", clean)
            if clean.strip() and len(clean.strip().split()) >= 3:
                found.append(clean.strip())
    return found[:5]



def fetch_genai_config():
    """Fetch GenAI config values safely inside app context."""
    with app.app_context():
        provider_cfg = Config.query.filter_by(key="genai_provider").first()
        key_cfg = Config.query.filter_by(key="genai_key").first()
        enabled_cfg = Config.query.filter_by(key="genai_enabled").first()
        prompt_cfg = Config.query.filter_by(key="genai_prompt").first()

        return {
            "provider": (provider_cfg.value or "").strip().lower() if provider_cfg else "",
            "api_key": (key_cfg.value or "").strip() if key_cfg else "",
            "enabled": (enabled_cfg.value or "false").strip().lower() == "true" if enabled_cfg else False,
            "prompt": (prompt_cfg.value or "").strip() if prompt_cfg else ""
        }


def generate_explanation(jd_text, resume_text, use_gpt=False):
    print("✅ generate_explanation called")

    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)

    jd_set = set(jd_skills)
    resume_set = set(resume_skills)

    exact_match = sorted(jd_set & resume_set)
    missing = sorted(jd_set - resume_set)
    semantic_pairs, semantic_ratio = semantic_skill_score(jd_skills, resume_skills)
    highlights = extract_sentences_with_keywords(resume_text, exact_match)
    categorized = categorize_skills(list(resume_set))

    jd_exp = extract_experience(jd_text)
    res_exp = extract_experience(resume_text)
    exp_match = abs(jd_exp - res_exp) <= 1

    explanation = {
        "summary": f"{len(exact_match)} exact, {len(semantic_pairs)} semantic matches. "
                   f"Experience: {res_exp} vs {jd_exp} yrs — {'✅ OK' if exp_match else '⚠️ Mismatch'}",
        "skills_matched": exact_match[:15],
        "skills_semantic": [f"{pair[0]} ↔ {pair[1]}" for pair in semantic_pairs[:5] if len(pair) >= 2],
        "skills_missing": missing[:10],
        "resume_highlights": highlights,
        "experience_years_resume": res_exp,
        "experience_years_jd": jd_exp,
        "skill_categories": categorized,
        "uncategorized_skills": [],
        "source": "SBERT"
    }

    try:
        config = fetch_genai_config()
        print(f"🔍 GenAI Config — Enabled: {config['enabled']}, Provider: {config['provider']}, Key present: {bool(config['api_key'])}")

        if use_gpt and config["enabled"] and config["provider"] == "cohere" and config["api_key"]:
            print("💡 Using Cohere for explanation")
            co = cohere.Client(config["api_key"])

            instruction = (config["prompt"] or "").strip()

            final_prompt = f"""
You are an expert AI recruiter. Follow the instruction below and analyze the candidate's resume in relation to the job description.

📌 Instruction:
{instruction}

📄 Job Description:
{jd_text[:1500]}

👤 Resume:
{resume_text[:1500]}
""".strip()

            response = co.chat(message=final_prompt, model="command-r")

            if hasattr(response, "text") and response.text.strip():
                explanation["gpt_summary"] = response.text.strip()[:MAX_SUMMARY_CHARS]
                explanation["source"] = "Cohere"
            else:
                explanation["gpt_summary"] = "⚠️ Cohere returned no content"
                explanation["source"] = "Cohere"
        else:
            print("⚠️ GenAI is disabled or skipped, fallback to SBERT only")

    except Exception as e:
        log_agent_error("GenAIExplanationError", str(e), method="generate_explanation")
        explanation["gpt_summary"] = f"⚠️ GenAI failed: {e}"
        explanation["source"] = "SBERT"

    return explanation


    