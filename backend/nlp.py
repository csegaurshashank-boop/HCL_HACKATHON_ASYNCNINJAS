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
    
    matches = []
    for idx in top_indices:
        if cosine_similarities[idx] > 0.1: 
            matches.append({
                "issue": df.iloc[idx]['description'],
                "resolution": df.iloc[idx]['resolution'],
                "similarity": round(float(cosine_similarities[idx]) * 100, 1)
            })
            
    if not matches:
        return {"suggested_fix": "No exact past match found. IT support will look into this shortly.", "top_matches": []}

    # 3. Gemini AI Analysis of Top 3 Matches
    context_data = ""
    for i, m in enumerate(matches):
        context_data += f"\nMatch #{i+1} (Similarity: {m['similarity']}%):\n- Past Issue: {m['issue']}\n- Successful Resolution: {m['resolution']}\n"

    prompt = f"""
    You are an expert IT Support Analyst. A user has a new issue: "{new_text}"
    
    I have analyzed our historical ticket database and found the following top {len(matches)} relevant past cases:
    {context_data}
    
    TASK:
    1. Analyze these past cases and identify the most likely root cause for the current issue.
    2. Provide a single, consolidated "Expert Fix" that combines the best parts of these resolutions.
    3. Keep it brief and actionable (max 3-4 lines).
    
    Format:
    Root Cause Analysis: [Brief analysis]
    Expert Fix: [Clear instructions]
    """
    
    ai_response = ""
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest', 
            contents=prompt
        )
        ai_response = response.text
    except Exception as e:
        ai_response = f"AI Engine is currently busy. Error: {str(e)}"

    return {
        "suggested_fix": ai_response,
        "top_matches": [m['resolution'] for m in matches]
    }

def update_csv(ticket_id, description, resolution):
    """Appends a new resolution to the tickets.csv and reloads the state."""
    csv_path = os.path.join(os.path.dirname(__file__), "data", "tickets.csv")
    global df
    try:
        import csv
        # Append to CSV
        with open(csv_path, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow([ticket_id, description, resolution])
        
        # Reload DataFrame
        df = pd.read_csv(csv_path)
        df.columns = df.columns.str.strip()
        return True
    except Exception as e:
        print(f"Error updating CSV: {e}")
        return False