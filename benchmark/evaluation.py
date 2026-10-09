"""
Evaluation & Benchmarking Harness.
Quantifies empirical performance of ABSA Engine against gold-standard human labels:
- Aspect Extraction Precision, Recall, and F1
- Macro F1 across hospitality taxonomy
- Sentiment Polarity Accuracy
- Sub-group performance on Hinglish vs Standard English
Zero hard-coded hotel names or review text (Rule 1 Compliant).
"""

import os
import sys
import json
from collections import defaultdict
from typing import Dict, Any, List

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from extract.absa_pipeline import pipeline

GOLD_LABELS_PATH = os.path.join(PROJECT_ROOT, "data", "gold_labels.json")

class EvaluationHarness:
    def __init__(self, gold_path: str = GOLD_LABELS_PATH):
        self.gold_path = gold_path

    def load_gold_data(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.gold_path):
            with open(self.gold_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def evaluate(self) -> Dict[str, Any]:
        dataset = self.load_gold_data()
        if not dataset:
            return {"error": "Gold evaluation dataset not found"}

        # Metrics trackers per aspect
        tp = defaultdict(int)
        fp = defaultdict(int)
        fn = defaultdict(int)

        sentiment_correct = 0
        sentiment_total = 0

        hinglish_correct = 0
        hinglish_total = 0

        english_correct = 0
        english_total = 0

        for item in dataset:
            text = item["text"]
            lang = item.get("language", "english")
            gold_annotations = {g["aspect"]: g["sentiment"] for g in item.get("ground_truth", [])}

            # Predict
            pred_list = pipeline.extract_aspects(text)
            pred_annotations = {p["aspect"]: p["sentiment"] for p in pred_list}

            # Evaluate Aspect detection & Sentiment alignment
            for aspect, gold_sent in gold_annotations.items():
                if aspect in pred_annotations:
                    tp[aspect] += 1
                    pred_sent = pred_annotations[aspect]
                    sentiment_total += 1
                    is_match = (pred_sent.lower() == gold_sent.lower())

                    if is_match:
                        sentiment_correct += 1

                    if lang == "hinglish":
                        hinglish_total += 1
                        if is_match:
                            hinglish_correct += 1
                    else:
                        english_total += 1
                        if is_match:
                            english_correct += 1
                else:
                    fn[aspect] += 1

            for aspect in pred_annotations:
                if aspect not in gold_annotations:
                    fp[aspect] += 1

        # Calculate Aspect-Level Precision, Recall, F1
        aspect_metrics = {}
        all_aspects = set(list(tp.keys()) + list(fp.keys()) + list(fn.keys()))

        f1_scores = []
        for a in sorted(all_aspects):
            a_tp = tp[a]
            a_fp = fp[a]
            a_fn = fn[a]

            precision = (a_tp / (a_tp + a_fp)) if (a_tp + a_fp) > 0 else 0.0
            recall = (a_tp / (a_tp + a_fn)) if (a_tp + a_fn) > 0 else 0.0
            f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

            aspect_metrics[a] = {
                "true_positives": a_tp,
                "false_positives": a_fp,
                "false_negatives": a_fn,
                "precision": round(precision * 100, 1),
                "recall": round(recall * 100, 1),
                "f1_score": round(f1 * 100, 1)
            }
            f1_scores.append(f1)

        macro_f1 = (sum(f1_scores) / len(f1_scores) * 100) if f1_scores else 0.0
        sentiment_acc = (sentiment_correct / sentiment_total * 100) if sentiment_total > 0 else 0.0
        hinglish_acc = (hinglish_correct / hinglish_total * 100) if hinglish_total > 0 else 0.0
        english_acc = (english_correct / english_total * 100) if english_total > 0 else 0.0

        return {
            "evaluation_dataset_size": len(dataset),
            "macro_f1": round(macro_f1, 1),
            "overall_sentiment_accuracy": round(sentiment_acc, 1),
            "hinglish_sentiment_accuracy": round(hinglish_acc, 1),
            "english_sentiment_accuracy": round(english_acc, 1),
            "total_aspect_observations_evaluated": sentiment_total,
            "aspect_metrics": aspect_metrics,
            "evaluation_status": "Empirically Verified Against Ground Truth Annotations"
        }

evaluation_harness = EvaluationHarness()

if __name__ == "__main__":
    results = evaluation_harness.evaluate()
    print("Macro F1:", results["macro_f1"], "%")
    print("Sentiment Accuracy:", results["overall_sentiment_accuracy"], "%")
    print("Hinglish Accuracy:", results["hinglish_sentiment_accuracy"], "%")
    for asp, m in results["aspect_metrics"].items():
        print(f"[{asp}] P={m['precision']}% R={m['recall']}% F1={m['f1_score']}%")
