import re
from collections import Counter
from utils.skill_extractor import extract_skills

def generate_explanation(jd_text, resume_text):
    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)

    jd_set = set(jd_skills)
    res_set = set(resume_skills)

    matched = sorted(jd_set & res_set)
    missing = sorted(jd_set - res_set)

    # Highlight sentences in resume that mention matched skills
    highlights = []
    for line in resume_text.split('\n'):
        lower_line = line.lower()
        if any(skill in lower_line for skill in matched):
            highlights.append(line.strip())

    # Word-level overlap (frequency based insight)
    jd_words = re.findall(r'\w+', jd_text.lower())
    res_words = re.findall(r'\w+', resume_text.lower())
    word_match_count = sum(1 for word in set(jd_words) if word in res_words)

    return {
        "summary": f"{len(matched)} matched, {len(missing)} missing — {word_match_count} words aligned.",
        "skills_matched": matched[:15],
        "skills_missing": missing[:10],
        "resume_highlights": highlights[:5]
    }
