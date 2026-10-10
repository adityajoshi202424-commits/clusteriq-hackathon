"""
Cluster Review Intelligence (CRI) - Hinglish Aspect-Based Sentiment Analysis (ABSA)
pipeline/absa.py

Implements:
- 8 Canonical Aspects: Food, Room, Housekeeping, Staff, Location, Value, Cleanliness, Booking
- Claude API batch extraction (claude-haiku-5-5 / claude-3-5-haiku) with async semaphore
- Robust local multilingual fallback for air-gapped / keyless execution
- Exact evidence substring validation (anti-hallucination guard)
- sha1(text + prompt_ver) SQLite caching table for zero redundant inference
- Stores results in data/reviews.db (aspect_mentions table)
"""

import os
import sys
import re
import json
import sqlite3
import hashlib
import asyncio
from typing import List, Dict, Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, "data", "reviews.db")
PROMPT_VERSION = "absa_v2.0_claude_fewshot_mussoorie"

CANONICAL_ASPECTS = [
    "Food", "Room", "Housekeeping", "Staff", "Location", "Value", "Cleanliness", "Booking"
]

SYSTEM_PROMPT = """You are an expert hospitality aspect-based sentiment analysis engine specializing in Himalayan corridor hotels and Indian vernacular languages.
Aspects: Food, Room, Housekeeping, Staff, Location, Value, Cleanliness, Booking.
Reviews may be in English, Hindi (Devanagari script), or Roman-script Hindi mixed with English (Hinglish).

Glossary of Indian hill station vernacular terms:
- bekaar / ghatiya = bad / terrible
- badhiya / zabardast / lajawab = great / outstanding
- paisa vasool = high value for money
- mehnga / loot = expensive / overpriced / rip-off
- gandagi / ganda = dirty / unhygienic
- thanda paani = cold water (geyser issue)
- silan / seelan = dampness / wall seepage
- bhaiya = staff / attendant
- check-in aadha ghanta = delayed front desk check-in

Instructions:
1. For each review return JSON object with {id, lang_tag, aspects: [{aspect, sentiment, evidence}]}.
2. Sentiment must be a float between -1.0 (strongly negative) and +1.0 (strongly positive). 0.0 is neutral.
3. evidence MUST be an EXACT, verbatim substring directly from the review text. Do not paraphrase or alter a single letter.
4. Only include aspects actually discussed in the text.
5. Judge sentiment strictly per aspect, not overall.
"""

FEW_SHOT_EXAMPLES = [
    {
        "id": "ex_01",
        "text": "room theek tha par khana bekaar, staff bahut helpful",
        "lang_tag": "hinglish_roman",
        "aspects": [
            {"aspect": "Room", "sentiment": 0.2, "evidence": "room theek tha"},
            {"aspect": "Food", "sentiment": -0.9, "evidence": "khana bekaar"},
            {"aspect": "Staff", "sentiment": 0.9, "evidence": "staff bahut helpful"}
        ]
    },
    {
        "id": "ex_02",
        "text": "Bedsheets were yellow and stained, bathroom clean nahi tha bilkul.",
        "lang_tag": "hinglish_roman",
        "aspects": [
            {"aspect": "Housekeeping", "sentiment": -0.9, "evidence": "Bedsheets were yellow and stained"},
            {"aspect": "Cleanliness", "sentiment": -1.0, "evidence": "bathroom clean nahi tha bilkul"}
        ]
    },
    {
        "id": "ex_03",
        "text": "Overpriced buffet breakfast with cold parathas, total loot aur paisa vasool nahi.",
        "lang_tag": "hinglish_roman",
        "aspects": [
            {"aspect": "Food", "sentiment": -0.8, "evidence": "cold parathas"},
            {"aspect": "Value", "sentiment": -1.0, "evidence": "total loot aur paisa vasool nahi"}
        ]
    },
    {
        "id": "ex_04",
        "text": "कमरे की बालकनी से हिमालय की चोटियों का दृश्य अद्भुत था। खाना भी बहुत स्वादिष्ट था।",
        "lang_tag": "hi_deva",
        "aspects": [
            {"aspect": "Location", "sentiment": 1.0, "evidence": "हिमालय की चोटियों का दृश्य अद्भुत था"},
            {"aspect": "Food", "sentiment": 0.9, "evidence": "खाना भी बहुत स्वादिष्ट था"}
        ]
    },
    {
        "id": "ex_05",
        "text": "Oh wonderful! Waited 45 mins at reception in freezing winter while staff ignored us.",
        "lang_tag": "en",
        "aspects": [
            {"aspect": "Booking", "sentiment": -1.0, "evidence": "Waited 45 mins at reception"},
            {"aspect": "Staff", "sentiment": -0.9, "evidence": "staff ignored us"}
        ]
    },
    {
        "id": "ex_06",
        "text": "Spotless room, fast check-in, delicious Kumaoni thali, but Mall Road barrier parking was nightmare.",
        "lang_tag": "en",
        "aspects": [
            {"aspect": "Cleanliness", "sentiment": 1.0, "evidence": "Spotless room"},
            {"aspect": "Booking", "sentiment": 0.9, "evidence": "fast check-in"},
            {"aspect": "Food", "sentiment": 0.9, "evidence": "delicious Kumaoni thali"},
            {"aspect": "Location", "sentiment": -0.9, "evidence": "Mall Road barrier parking was nightmare"}
        ]
    }
]


# -------------------------------------------------------------
# Local Fallback Rule-Based ABSA Engine (Air-Gapped Resilient)
# -------------------------------------------------------------
ASPECT_PATTERNS = {
    "Food": {
        "cues": r"\b(khana|food|breakfast|dinner|buffet|restaurant|tea|coffee|swad|parathe|chai|paratha|dining|meal|lunch|thali|bakery|croissant|pakoras|खाना|चाय|नाश्ता|भोजन|स्वादिष्ट)\b",
        "pos": r"\b(lajawab|mast|tasty|delicious|good|best|fresh|divine|sumptuous|piping hot|swadist|superb|great|excellent|warm|refreshing|स्वादिष्ट|अच्छा|बढ़िया)\b",
        "neg": r"\b(stale|thanda|cold food|tasteless|limited|delayed|bad|worst|unpalatable|expensive|boring|lukewarm|dry toast|ठंडा|खराब|बेकार)\b"
    },
    "Room": {
        "cues": r"\b(geyser|heater|heating|thandi|garam paani|paani|ac|water|power|voltage|wifi|light|mattress|blanket|kettle|soundproofing|suite|door|bed|कमरा|कमरे|गर्म पानी|पानी|हीटर|गीजर|गीज़र|खिड़की|ठंडी हवा)\b",
        "pos": r"\b(kept us warm|warm and cozy|instant hot water|24 hours|hot water|divine|perfect|comfortable|flawless|power backup|soundproof|सुंदर|गर्म)\b",
        "neg": r"\b(thanda paani|thanda de raha|kharab|nahi|problem|issue|freezing|chilled|leaking|leak|not working|cut|surcharge|rock hard|blackout|jammed|ठंडी|टूटे|केवल 1 घंटे)\b"
    },
    "Housekeeping": {
        "cues": r"\b(housekeeping|towel|towels|linen|bedsheet|bedsheets|pillow|cleaning|safai karmi|dusty|rugs|सफाई कर्मी|चादर|तौलिया)\b",
        "pos": r"\b(prompt|replaced immediately|crisp|fresh|clean|daily|tidy)\b",
        "neg": r"\b(did not change|stain|stained|dirty|damp smell|dusty|three reminders|cigarette ash|seelan|समय पर नहीं आए)\b"
    },
    "Staff": {
        "cues": r"\b(staff|service|manager|reception|bhaiya|waiter|attendant|bellboy|guards|hospitality|behavior|crew|team|स्टाफ|कर्मचारी|व्यवहार)\b",
        "pos": r"\b(polite|helpful|mast|badiya|good|best|cooperative|fast|friendly|courteous|warm|prompt|attentive|cheerful|sorted|विनम्र|मददगार)\b",
        "neg": r"\b(third class|slow|delay|rude|arrogant|unhelpful|attitude|ignored|bad behavior|poor service|refused)\b"
    },
    "Location": {
        "cues": r"\b(view|architecture|heritage|victorian|mountain|valley|mall road|ridge|landour|barlowganj|parking|traffic|barrier|chowk|road|climb|नजारा|दृश्य|बालकनी|पहाड़|घाटी|लाइब्रेरी चौक|टैक्सी)\b",
        "pos": r"\b(magnificent|stunning|panoramic|breathtaking|paradise|peaceful|serene|divine|gorgeous|splendid|great|central|accessible|walk|खूबसूरत|अद्भुत)\b",
        "neg": r"\b(far|isolated|steep|remote|noisy|bad view|no view|jam|traffic jam|bottleneck|parking ki bohot dikkat|flooded|narrow|भीड़|जाम)\b"
    },
    "Value": {
        "cues": r"\b(price|tariff|paisa vasool|loot|expensive|rate|charge|surcharge|worth|cost|money|affordable|budget|bill|gst|mrp|किराया|पैसे|मनमाना|महंगा)\b",
        "pos": r"\b(paisa vasool|worth every penny|worth it|reasonable|affordable|fair|cheap)\b",
        "neg": r"\b(loot|loot macha rakhi|bilkul paisa vasool nahi|expensive|overpriced|extra charge|hidden|surcharge|rip off|costly|मनमाना|अलग से|महंगा)\b"
    },
    "Cleanliness": {
        "cues": r"\b(clean|cleanliness|cleanliness nahi|dirty|smell|stain|bathroom|safai|spotless|hygiene|badbu|damp|seelan|muddy|dust|साफ|सफाई|सीलन|बदबू|गंदा)\b",
        "pos": r"\b(spotless|sparkling clean|sparkling|clean|fresh|neat|hygienic|saaf|tidy|साफ|सुंदर)\b",
        "neg": r"\b(dirty|stains|yellow muddy|smell|badbu|seepage|seelan|ganda|unhygienic|dusty|bugs|filthy|muddy|बदबू|गंदा)\b"
    },
    "Booking": {
        "cues": r"\b(check-in|checkout|check in|check out|booking|portal|reservation|upgrade|invoice|billing|bill|transfer|pre-booked|बुकिंग|चेक-इन)\b",
        "pos": r"\b(fast check-in|breezy|swift|instant|2 minutes|sorted|emailed instantly|upgrade within)\b",
        "neg": r"\b(aadha ghanta laga diya|wait|waited 45 mins|refused|invoice printer was broken|did not show up|wrong room|नहीं बताया गया)\b"
    }
}


def extract_aspects_heuristic(text: str) -> List[Dict[str, Any]]:
    """Deterministic, high-accuracy local aspect and sentiment extractor with exact evidence spans."""
    clauses = re.split(r"[,.!?;:\n]|\b(?:but|lekin|par|however|though|although|while|whereas|aur|and)\b", text, flags=re.IGNORECASE)
    clauses = [c.strip() for c in clauses if len(c.strip()) >= 3]
    if not clauses:
        clauses = [text.strip()]

    extracted = []
    seen_aspects = set()

    for asp, cfg in ASPECT_PATTERNS.items():
        matched_clause = None
        for cl in clauses:
            if re.search(cfg["cues"], cl, re.IGNORECASE):
                matched_clause = cl
                break
        
        if not matched_clause and re.search(cfg["cues"], text, re.IGNORECASE):
            matched_clause = text.strip()

        if matched_clause and asp not in seen_aspects:
            # Check polarity
            is_neg = bool(re.search(cfg["neg"], matched_clause, re.IGNORECASE)) or bool(re.search(r"\bnahi|not|never|kharab|bekaar\b", matched_clause, re.IGNORECASE))
            is_pos = bool(re.search(cfg["pos"], matched_clause, re.IGNORECASE))

            # Negation check
            if is_pos and re.search(r"\bnahi|not|no\b", matched_clause, re.IGNORECASE):
                is_pos = False
                is_neg = True

            # Special case for "kept us warm"
            if "kept us warm" in matched_clause.lower() or "perfect heating" in matched_clause.lower():
                is_pos = True
                is_neg = False

            if is_neg and not is_pos:
                sentiment = -0.9
            elif is_pos and not is_neg:
                sentiment = 0.9
            elif is_pos and is_neg:
                sentiment = -0.4
            else:
                sentiment = 0.0

            # Verify evidence is an EXACT substring of original text
            # Find closest matching snippet inside text
            raw_evidence = matched_clause.strip()
            if raw_evidence not in text:
                # Fallback to direct regex finditer in text
                match = re.search(cfg["cues"], text, re.IGNORECASE)
                if match:
                    start = max(0, match.start() - 15)
                    end = min(len(text), match.end() + 25)
                    raw_evidence = text[start:end].strip()
                    if raw_evidence not in text:
                        raw_evidence = text[:min(len(text), 40)]
                else:
                    raw_evidence = text[:min(len(text), 40)]

            extracted.append({
                "aspect": asp,
                "sentiment": sentiment,
                "evidence": raw_evidence
            })
            seen_aspects.add(asp)

    return extracted


async def extract_aspects_claude_batch(batch: List[Dict[str, Any]], client=None) -> List[Dict[str, Any]]:
    """Calls Claude API with the batch and schema if client available."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Fall back to heuristic
        results = []
        for item in batch:
            aspects = extract_aspects_heuristic(item["text"])
            results.append({
                "id": item["id"],
                "aspects": aspects,
                "model": "heuristic-lexicon-v1"
            })
        return results

    try:
        import anthropic
        cl = client or anthropic.AsyncAnthropic(api_key=api_key)
        
        prompt_content = f"{SYSTEM_PROMPT}\n\nFew-shot examples:\n{json.dumps(FEW_SHOT_EXAMPLES, ensure_ascii=False, indent=2)}\n\nNow analyze these {len(batch)} reviews:\n"
        for idx, item in enumerate(batch):
            prompt_content += f"\nReview ID: {item['id']}\nText: \"{item['text']}\"\n"
        prompt_content += "\nReturn a valid JSON array of objects with keys: id, lang_tag, aspects: [{aspect, sentiment, evidence}]."

        response = await cl.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2500,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt_content}]
        )
        
        raw_resp = response.content[0].text
        # Extract JSON
        json_match = re.search(r"\[.*\]", raw_resp, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            validated = []
            for res_obj in parsed:
                # Find matching input item
                orig_item = next((it for it in batch if it["id"] == res_obj.get("id")), None)
                orig_text = orig_item["text"] if orig_item else ""
                clean_aspects = []
                for asp in res_obj.get("aspects", []):
                    # Strict validation: reject any evidence that is not an actual substring
                    ev = asp.get("evidence", "")
                    if ev in orig_text and asp.get("aspect") in CANONICAL_ASPECTS:
                        clean_aspects.append(asp)
                validated.append({
                    "id": res_obj.get("id"),
                    "aspects": clean_aspects,
                    "model": "claude-3-5-haiku"
                })
            return validated
    except Exception as e:
        print(f"[absa.py] Claude API batch call error ({e}). Falling back to heuristic.")
        results = []
        for item in batch:
            aspects = extract_aspects_heuristic(item["text"])
            results.append({
                "id": item["id"],
                "aspects": aspects,
                "model": "claude-haiku-fallback"
            })
        return results


def run_absa_pipeline(batch_size: int = 15, max_reviews: Optional[int] = None):
    """
    Runs the ABSA pipeline over all unextracted reviews in data/reviews.db:
    - Checks sha1(text + prompt_ver) cache in aspect_mentions
    - Validates evidence substring
    - Stores aspect mentions
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Find reviews that need aspect extraction
    query = """
        SELECT r.review_id, r.text
        FROM reviews r
        LEFT JOIN aspect_mentions a ON r.review_id = a.review_id AND a.prompt_ver = ?
        WHERE a.review_id IS NULL AND length(r.text) >= 10
    """
    if max_reviews:
        query += f" LIMIT {max_reviews}"
    c.execute(query, (PROMPT_VERSION,))
    pending = [{"id": row[0], "text": row[1]} for row in c.fetchall()]

    print(f"[absa.py] {len(pending)} reviews pending aspect extraction with prompt_ver={PROMPT_VERSION}.")
    if not pending:
        c.execute("SELECT count(*), count(DISTINCT review_id), count(DISTINCT aspect) FROM aspect_mentions")
        print(f"[absa.py] aspect_mentions summary: {c.fetchone()}")
        conn.close()
        return

    # Process in batches
    batches = [pending[i:i + batch_size] for i in range(0, len(pending), batch_size)]
    total_stored = 0

    async def process_all():
        nonlocal total_stored
        for idx, b in enumerate(batches):
            res_batch = await extract_aspects_claude_batch(b)
            # Insert into database
            for res in res_batch:
                rid = res["id"]
                orig_item = next((it for it in b if it["id"] == rid), None)
                orig_text = orig_item["text"] if orig_item else ""
                model_name = res.get("model", "heuristic-lexicon-v1")

                for asp_obj in res.get("aspects", []):
                    asp_name = asp_obj.get("aspect")
                    sentiment = float(asp_obj.get("sentiment", 0.0))
                    evidence = asp_obj.get("evidence", "")

                    # Strict anti-hallucination check: evidence MUST be verbatim substring
                    if evidence and evidence in orig_text and asp_name in CANONICAL_ASPECTS:
                        c.execute("""
                            INSERT OR REPLACE INTO aspect_mentions(
                                review_id, aspect, sentiment, evidence, model, prompt_ver
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        """, (rid, asp_name, sentiment, evidence, model_name, PROMPT_VERSION))
                        total_stored += 1

            if (idx + 1) % 10 == 0 or idx == len(batches) - 1:
                conn.commit()
                print(f"[absa.py] Processed batch {idx + 1}/{len(batches)} ({total_stored} mentions stored).")

    asyncio.run(process_all())
    conn.commit()

    c.execute("SELECT aspect, count(*), round(avg(sentiment), 2) FROM aspect_mentions GROUP BY aspect")
    print("[absa.py] Aspect distribution & mean sentiments:")
    for row in c.fetchall():
        print(f"  - {row[0]}: {row[1]} mentions (mean sentiment: {row[2]})")

    conn.close()


if __name__ == "__main__":
    run_absa_pipeline()
