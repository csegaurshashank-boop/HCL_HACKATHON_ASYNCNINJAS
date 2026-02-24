import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from google import genai
from config import GEMINI_API_KEY
import os

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

# Load CSV data safely
csv_path = os.path.join(os.path.dirname(__file__), "data", "tickets.csv")
try:
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip() 
except Exception as e:
    print(f"Warning: Dataset not found at {csv_path}")
    df = pd.DataFrame(columns=["ticket_id", "description", "resolution"])

def get_ai_suggestion(new_text: str, top_n=3):
    if df.empty:
        return {"suggested_fix": "Knowledge base is empty.", "top_matches": []}

    # 1. TF-IDF Vectorization
    vectorizer = TfidfVectorizer(stop_words='english')
    all_texts = df['description'].tolist() + [new_text]
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # 2. Cosine Similarity Match
    cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
    top_indices = cosine_similarities.argsort()[-top_n:][::-1]
    
    resolutions = []
    for idx in top_indices:
        if cosine_similarities[idx] > 0.1: 
            resolutions.append(df.iloc[idx]['resolution'])
            
    if not resolutions:
        return {"suggested_fix": "No exact past match found. IT support will look into this shortly.", "top_matches": []}

    # 3. Gemini AI Summarization
    combined_text = "\n- ".join(resolutions)
    prompt = f"""
    A user has raised an IT support ticket: "{new_text}"
    Here are the resolutions from past similar tickets:
    - {combined_text}
    
    Based ONLY on these past resolutions, write a single, clear, and actionable 2-step troubleshooting guide for the user to try instantly. Do not add outside information.
    """
    
    ai_response = ""
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash', 
            contents=prompt
        )
        ai_response = response.text
    except Exception as e:
        ai_response = f"AI Engine is currently busy. Error: {str(e)}"

    return {
        "suggested_fix": ai_response,
        "top_matches": resolutions[:3]
    }