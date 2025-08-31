# utils/songSuggestion.py
import sys, json, librosa, numpy as np, requests
from sklearn.metrics.pairwise import cosine_similarity
import tempfile

def extract_mfcc(url):
    try:
        r = requests.get(url, timeout=10)
        with tempfile.NamedTemporaryFile(delete=True, suffix=".mp3") as f:
            f.write(r.content)
            f.flush()
            y, sr = librosa.load(f.name, duration=30)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
            return np.mean(mfcc, axis=1)
    except Exception as e:
        return None

def main():
 
    data = json.load(sys.stdin)
    watched_urls = data.get("watched", [])
    all_songs = data.get("all", [])

    watched_vectors = [extract_mfcc(url) for url in watched_urls]
    watched_vectors = [v for v in watched_vectors if v is not None]

    if not watched_vectors:
        print(json.dumps({ "error": "No valid watched songs" }))
        return

    user_vector = np.mean(watched_vectors, axis=0)

    result = []
    for song in all_songs:
        vec = extract_mfcc(song["music"])
        if vec is not None:
            score = float(cosine_similarity(user_vector.reshape(1, -1), vec.reshape(1, -1))[0][0])
            result.append({
                "title": song["title"],
                "id": song["_id"],
                "music": song["music"],
                "genre": song["genre"],
                "album": song["album"],
                "cover": song["cover"],
                "owner": song["owner"],
                "score": round(score, 4)
            })

    result.sort(key=lambda x: x["score"], reverse=True)
    print(json.dumps(result[:10]))

if __name__ == "__main__":
    main()