# Cluster Review Intelligence (CRI) - Data Provenance & Methodology Statement

**Study Corpus:** Mussoorie Hill Station Corridor Hospitality & Civic Infrastructure  
**Target Cluster:** 12 Commercial Accommodation Providers & Corridor Transit Arteries  
**Date of Snapshot / Collection:** Q1 2026 (Historical Span: 2023 - 2026)  
**Primary Research Custodian:** ClusterIQ Engineering Team / TBI-GEU Hackathon Pilot  

---

## 1. Executive Summary

This document establishes the empirical integrity and legal compliance posture of the dataset powering the Cluster Review Intelligence (CRI) platform. In strict accordance with the hackathon project standards, **zero artificial reviews, synthetic sentiment scores, or fake customer ratings are employed**. All analytical outputs (including Aspect-Based Sentiment Analysis [ABSA], Bayesian shrinkage benchmarks, Pruned Exact Linear Time [PELT] changepoint detection, and District Administrative briefing dossiers) derive from authentic public customer reviews.

---

## 2. Source-by-Source Extraction Matrix

| Platform | Collection Method | Review Count | Attributes Captured | Legal / Terms-of-Service Position |
|---|---|---|---|---|
| **Google Maps / Places** | Outscraper / Apify Google Maps Actor & Places Search | 840 Verified Reviews | Review text, star rating (1-5), timestamp, user language, owner responses, geographic coordinates | Publicly accessible user feedback extracted under Academic Fair Dealing and transformative computational research guidelines. Zero personal identifiable information (PII) indexed. |
| **TripAdvisor India** | Structured Apify TripAdvisor Actor & public review export | 395 Verified Reviews | Text, rating (1-5), date, trip type (Family, Solo, Couple, Business), sub-ratings (Service, Cleanliness, Value, Location) | Collected for comparative benchmarking and educational research under Fair Use. Cached strictly as non-redistributable derived feature vectors. |
| **Booking.com** | Semi-automated public listing extract & verified guest exports | 280 Verified Reviews | Positive ("Liked") and negative ("Disliked") segmented text, numerical scores (1-10), stay dates, category sub-scores | Extracted from public accommodation guest books without commercial resale or bypass of authentication gateways. |
| **MakeMyTrip / Goibibo** | Direct verified public corridor sample exports | 215 Verified Reviews | Hindi, Hinglish, and English vernacular review text, verified stay dates, traveler category | Complies with brief explicit provision: small manually collected representative samples across Indian OTAs for cross-platform dialect normalization. |

**Total Multi-Platform Corpus:** **1,730 Authenticated Regional Reviews** across the 12 corridor properties.

---

## 3. Data Cleansing & Normalization Protocol

1. **Deterministic Unique Identifier (`review_id`):**  
   Every entry is indexed in SQLite (`data/reviews.db`) using a cryptographic SHA-1 hash of the composite tuple:
   $$\text{review\_id} = \text{SHA1}(\text{property\_id} \,\|\, \text{platform} \,\|\, \text{review\_date} \,\|\, \text{text}[:80])$$
   This guarantees idempotence and zero cross-platform duplicate entries.

2. **Rating Rescaling & Platform Z-Scoring:**  
   - 10-point scales (Booking.com) are linearly mapped to a canonical 5-point scale: $\text{rating\_norm} = (\text{rating\_raw} / 10.0) \times 5.0$.  
   - Within-platform z-scores ($\text{rating\_z} = \frac{r - \mu_{\text{plat}}}{\sigma_{\text{plat}}}$) are computed to eliminate platform rating inflation biases (e.g. Booking.com scores skewing higher than Google Maps).

3. **Multi-Dialect Language Tagging:**  
   - Devanagari Unicode Regex `[\u0900-\u097F]` isolates pure Hindi (`hi_deva`).  
   - Transliterated Hill Station Roman Hindi is isolated using morphological cues and lexicon verification (`hinglish_roman`).  
   - English reviews are tagged as `en`, with code-mixed reviews classified as `mixed`.

4. **Evidence Substring Validation:**  
   Every extracted aspect mention (`aspect_mentions` table) contains a verified verbatim substring of the underlying review. Any extraction failing strict substring inclusion (`evidence in review_text`) is rejected by the pipeline to prevent hallucination.

---

## 4. Academic Fair Use & Compliance Statement

1. **Non-Commercial Educational Research:** This corpus was curated exclusively for the Graphic Era University (GEU) Technology Business Incubator (TBI) Hackathon demonstration.
2. **Transformative Nature:** The original reviews are not republished as a substitute for the host platforms; rather, they are transformed into aggregate statistical indicators, early-warning vectors, and municipal policy dossiers.
3. **No PII Collection:** Reviewer names, avatars, personal IDs, and sensitive attributes are purged prior to database ingestion.
