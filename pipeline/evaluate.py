"""
Cluster Review Intelligence (CRI) - Evaluation Harness
pipeline/evaluate.py

Evaluates ABSA accuracy against hand-labelled gold_60.csv:
- Computes per-aspect Precision, Recall, and F1
- Computes Sentiment Directional Accuracy (% agreement with ground truth polarity)
- Measures Hinglish vs English subset performance
- Produces verified empirical metrics for the hackathon evidence slide
"""

import os
import sys
import csv
import pandas as pd
import numpy as np
from typing import Dict, Any

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from pipeline.absa import extract_aspects_heuristic, CANONICAL_ASPECTS

GOLD_PATH = os.path.join(PROJECT_ROOT, "data", "labels", "gold_60.csv")


def evaluate_model():
    if not os.path.exists(GOLD_PATH):
        print(f"[evaluate.py] Error: {GOLD_PATH} does not exist.")
        return

    df_gold = pd.read_csv(GOLD_PATH)
    # Group ground truth by text
    gold_by_text = {}
    for _, row in df_gold.iterrows():
        t = str(row["text"]).strip()
        gold_by_text.setdefault(t, {
            "id": row["id"],
            "lang_tag": row["lang_tag"],
            "aspects": {}
        })
        gold_by_text[t]["aspects"][str(row["aspect"])] = float(row["sentiment"])

    print(f"[evaluate.py] Loaded {len(gold_by_text)} distinct hand-labelled test reviews from {GOLD_PATH}.")
    print(f"[evaluate.py] Total gold aspect annotations: {len(df_gold)}")

    # Confusion matrix counters per aspect
    aspect_stats = {
        asp: {"tp": 0, "fp": 0, "fn": 0, "sent_correct": 0, "sent_total": 0}
        for asp in CANONICAL_ASPECTS
    }

    # Language subset metrics
    lang_stats = {
        "hinglish_roman": {"tp": 0, "fp": 0, "fn": 0, "sent_correct": 0, "sent_total": 0},
        "hi_deva": {"tp": 0, "fp": 0, "fn": 0, "sent_correct": 0, "sent_total": 0},
        "en": {"tp": 0, "fp": 0, "fn": 0, "sent_correct": 0, "sent_total": 0}
    }

    for text, gold_info in gold_by_text.items():
        lang = gold_info["lang_tag"]
        gold_aspects = gold_info["aspects"]
        
        # Predict aspects
        pred_items = extract_aspects_heuristic(text)
        pred_aspects = {p["aspect"]: float(p["sentiment"]) for p in pred_items}

        all_asps = set(gold_aspects.keys()).union(set(pred_aspects.keys()))
        for asp in all_asps:
            in_gold = asp in gold_aspects
            in_pred = asp in pred_aspects

            if in_gold and in_pred:
                aspect_stats[asp]["tp"] += 1
                if lang in lang_stats:
                    lang_stats[lang]["tp"] += 1

                # Check sentiment directional agreement
                gold_sign = 1 if gold_aspects[asp] > 0 else (-1 if gold_aspects[asp] < 0 else 0)
                pred_sign = 1 if pred_aspects[asp] > 0 else (-1 if pred_aspects[asp] < 0 else 0)
                aspect_stats[asp]["sent_total"] += 1
                if lang in lang_stats:
                    lang_stats[lang]["sent_total"] += 1

                if gold_sign == pred_sign:
                    aspect_stats[asp]["sent_correct"] += 1
                    if lang in lang_stats:
                        lang_stats[lang]["sent_correct"] += 1

            elif in_pred and not in_gold:
                aspect_stats[asp]["fp"] += 1
                if lang in lang_stats:
                    lang_stats[lang]["fp"] += 1

            elif in_gold and not in_pred:
                aspect_stats[asp]["fn"] += 1
                if lang in lang_stats:
                    lang_stats[lang]["fn"] += 1

    # Print Report Table
    print("\n" + "=" * 80)
    print("CLUSTERIQ ABSA EVALUATION HARNESS - GOLD STANDARD BENCHMARK (N=60)")
    print("=" * 80)
    print(f"{'Aspect':<15} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Sentiment Acc':<14} | {'Support':<8}")
    print("-" * 80)

    total_tp, total_fp, total_fn = 0, 0, 0
    total_sent_corr, total_sent_tot = 0, 0

    for asp in CANONICAL_ASPECTS:
        s = aspect_stats[asp]
        p = s["tp"] / (s["tp"] + s["fp"]) if (s["tp"] + s["fp"]) > 0 else 0.0
        r = s["tp"] / (s["tp"] + s["fn"]) if (s["tp"] + s["fn"]) > 0 else 0.0
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
        sent_acc = (s["sent_correct"] / s["sent_total"] * 100) if s["sent_total"] > 0 else 100.0
        support = s["tp"] + s["fn"]

        total_tp += s["tp"]
        total_fp += s["fp"]
        total_fn += s["fn"]
        total_sent_corr += s["sent_correct"]
        total_sent_tot += s["sent_total"]

        print(f"{asp:<15} | {p:.3f}      | {r:.3f}   | {f1:.3f}    | {sent_acc:.1f}%          | {support:<8}")

    micro_p = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    micro_r = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    micro_f1 = 2 * micro_p * micro_r / (micro_p + micro_r) if (micro_p + micro_r) > 0 else 0.0
    micro_sent_acc = (total_sent_corr / total_sent_tot * 100) if total_sent_tot > 0 else 100.0

    print("-" * 80)
    print(f"{'OVERALL (MICRO)':<15} | {micro_p:.3f}      | {micro_r:.3f}   | {micro_f1:.3f}    | {micro_sent_acc:.1f}%          | {len(df_gold):<8}")
    print("=" * 80)

    print("\nPerformance by Vernacular Subset:")
    for lang_name, ls in lang_stats.items():
        lp = ls["tp"] / (ls["tp"] + ls["fp"]) if (ls["tp"] + ls["fp"]) > 0 else 0.0
        lr = ls["tp"] / (ls["tp"] + ls["fn"]) if (ls["tp"] + ls["fn"]) > 0 else 0.0
        lf1 = 2 * lp * lr / (lp + lr) if (lp + lr) > 0 else 0.0
        ls_acc = (ls["sent_correct"] / ls["sent_total"] * 100) if ls["sent_total"] > 0 else 100.0
        print(f"  * {lang_name:<16}: Precision={lp:.3f}, Recall={lr:.3f}, F1={lf1:.3f}, Sentiment Accuracy={ls_acc:.1f}% (N={ls['tp'] + ls['fn']})")

    return {
        "micro_precision": round(micro_p, 3),
        "micro_recall": round(micro_r, 3),
        "micro_f1": round(micro_f1, 3),
        "sentiment_accuracy": round(micro_sent_acc, 1),
        "total_gold_annotations": len(df_gold),
        "aspect_stats": aspect_stats,
        "lang_stats": lang_stats
    }


if __name__ == "__main__":
    evaluate_model()
