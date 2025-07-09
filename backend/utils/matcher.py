from sentence_transformers import SentenceTransformer, util
import json
import torch  # ✅ You need this to convert JSON to tensors
from utils.utils import log_agent_error  # ✅ To log errors

model = SentenceTransformer("all-MiniLM-L6-v2")

def compute_full_text_score(jd_embedding_str, profile_embedding_str):
    try:
        jd_vec = torch.tensor(json.loads(jd_embedding_str))
        profile_vec = torch.tensor(json.loads(profile_embedding_str))
        return float(util.cos_sim(jd_vec, profile_vec)[0][0])
    except Exception as e:
        log_agent_error("EmbeddingError", str(e), method="compute_full_text_score")
        return 0.0

def get_label(score):
    if score > 0.8:
        return "Strong Match"
    elif score > 0.6:
        return "Good Match"
    elif score > 0.4:
        return "Average"
    else:
        return "Weak"
