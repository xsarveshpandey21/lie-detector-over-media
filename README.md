# 🔍 Lie Detector Over Media

<div align="center">

**"See what's real."**

A simple web tool to help you check whether text, photos, video, audio, or website links are reliable.

[![CI](https://img.shields.io/badge/CI-Passing-brightgreen?logo=githubactions&logoColor=white)](#-quick-start)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5E3C.svg)](https://opensource.org/licenses/MIT)
[![Copyright](https://img.shields.io/badge/Copyright-Sarvesh%20Pandey-F6C453)](#-copyright--license)
[![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-F6C453?logo=node.js&logoColor=black)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-222222?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Features](#-what-works-right-now) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Architecture](#-architecture--deployment) • [ML Notes](#-machine-learning-notes) • [Limitations & Privacy](#-limitations--privacy) • [Copyright & License](#-copyright--license) • [Changelog](#-changelog)

</div>

---

## 📌 What Works Right Now

Lie Detector Over Media adheres to a strict honesty rule: **never fabricate results or claim certainty**. If an external AI model or API key is not configured, we provide honest `"not checked"` and `"not available"` transparency states with `score: null` rather than fake scores.

| Content Type | What We Check (No Keys) | What Gets Checked (With Keys) | What We CANNOT Do Yet |
| :--- | :--- | :--- | :--- |
| 📝 **Text** | Heuristic linguistic analysis (excessive capitalization, sensational punctuation, emotional clickbait, artificial urgency markers) and known debunked rumor lookup. | Real-time fact checks via **Google Fact Check Tools API** (querying PolitiFact, Snopes, FactCheck.org, Reuters) + structured reasoning & label normalization via **OpenAI** (`gpt-4o-mini`). | Fact-check private claims or novel local events not covered by public fact-checkers; guarantee 100% factual certainty. |
| 🖼️ **Photo** | Magic byte header sniffing (JPEG, PNG, WebP, GIF), dimensions, aspect ratio, camera EXIF metadata extraction (make, model, capture timestamp, exposure), and editing software traces (Photoshop, GIMP, Canva tags). | Optional external image forensics / AI generation detection microservice (`IMAGE_DETECTOR_URL`). | Reliably detect AI-generated imagery or deepfakes from pixel data alone without a dedicated model. When unconfigured, returns `score: null` and explains why. |
| 🎬 **Video** | Video container header inspection (ISO MP4 / WebM signatures), format MIME validation, file size integrity, and stream metadata. | Optional external deepfake video analysis microservice (`VIDEO_DETECTOR_URL`). | Frame-by-frame deepfake facial analysis or audio-video lip synchronization verification in browser/serverless environments. Returns `score: null`. |
| 🎙️ **Voice / Audio** | Audio container sniffing, audio duration, bitrate, sample rate, channels, and lossless/lossy compression analysis via `music-metadata`. | Optional external synthetic voice cloning detection microservice (`AUDIO_DETECTOR_URL`). | Accurately detect advanced synthetic speech or voice cloning without dedicated audio neural network classifiers. Returns `score: null`. |
| 🔗 **Website Link** | URL structure validation, HTTPS encryption status, direct IP address host detection, URL shortener redirection warnings (`bit.ly`, `tinyurl.com`), punycode/IDN homograph attack detection, and typosquatting lookalike detection against known trusted and low-credibility news domains. | **Google Safe Browsing Lookup API** (phishing, malware, and social engineering threat lists). | Crawl dynamic client-rendered single-page applications or verify full webpage text without server-side browser execution. |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20 or later (`node -v`)
- **npm**: v10 or later (`npm -v`)
- **Python**: 3.10+ (optional, only needed for local ML training in `/ml`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/xsarveshpandey21/lie-detector-over-media.git
cd lie-detector-over-media

# Install root, backend, and frontend dependencies in one command
npm run install:all
```

### 2. Run Tests & Validation

```bash
# Run both backend and frontend test suites
npm test

# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint (zero warnings allowed)
npm run lint
```

### 3. Run Locally

Open two terminal tabs:

```bash
# Terminal 1: Backend API (runs on http://localhost:8080)
npm run dev:backend

# Terminal 2: Frontend UI (runs on http://localhost:5173)
npm run dev:frontend
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Environment Variables

Copy `backend/.env.sample` to `backend/.env` if you wish to configure optional integrations:

```bash
cp backend/.env.sample backend/.env
```

> **Note:** **None of these keys are required to run the app.** Lie Detector Over Media works out of the box with honest "not available" states.

| Variable | Default | Purpose | Where to get one |
| :--- | :--- | :--- | :--- |
| `PORT` | `8080` | Port for Express backend server in local development. | System / local environment |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed CORS origins. Default is same-origin in production. | Deployment domain |
| `MAX_UPLOAD_MB` | `4` | Maximum allowable upload file size in megabytes. | Set to `<= 4` for Vercel |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit sliding window (15 minutes in milliseconds). | Security configuration |
| `RATE_LIMIT_MAX` | `30` | Maximum requests per IP address within the rate window. | Security configuration |
| `FACT_CHECK_GOOGLE_API_KEY` | *(empty)* | Enables real-time claim verification against global fact-checking publishers via Google Fact Check Tools API. | [Google Fact Check APIs](https://toolbox.google.com/factcheck/apis) |
| `OPENAI_API_KEY` | *(empty)* | Enables LLM claim reasoning and conversational context responses via strict JSON formatting. | [OpenAI Platform](https://platform.openai.com) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model identifier used for claim reasoning. | OpenAI Platform |
| `GOOGLE_TRANSLATE_API_KEY` | *(empty)* | Enables batched multi-language translation (e.g. English ↔ Hindi). | [Google Cloud Translation](https://cloud.google.com/translate) |
| `GOOGLE_SAFE_BROWSING_KEY` | *(empty)* | Enables malware and phishing verification for URL links. | [Google Safe Browsing](https://developers.google.com/safe-browsing) |
| `TEXT_MODEL_URL` | *(empty)* | URL to optional self-hosted FastAPI text model (see `/ml`). | Self-hosted instance |
| `IMAGE_DETECTOR_URL` | *(empty)* | URL to optional self-hosted image forensics model. | Self-hosted instance |
| `VIDEO_DETECTOR_URL` | *(empty)* | URL to optional self-hosted video forensics model. | Self-hosted instance |
| `AUDIO_DETECTOR_URL` | *(empty)* | URL to optional self-hosted audio forensics model. | Self-hosted instance |

---

## 🏛️ Architecture & Deployment

### High-Level Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          Browser (React 18 + TS)        │
                  │   - 3-Step Plain English Flow           │
                  │   - Warm Paper Theme & Print View       │
                  │   - Client-side 4 MB validation         │
                  └────────────────────┬────────────────────┘
                                       │ /api/*
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    Express API (CommonJS / Node 20)     │
                  │   - Helmet, CORS, Rate Limiting (30/15m)│
                  │   - Memory Multer (0-Storage Buffer)    │
                  │   - Label Normalization Engine          │
                  │   - In-Memory Fact Check Cache (10m)    │
                  └───────┬──────────────────────┬──────────┘
                          │                      │
             ┌────────────┴──────────┐    ┌──────┴──────────────────┐
             ▼                       ▼    ▼                         ▼
   Google Fact Check API      OpenAI Mini   Google Safe Browsing   Local Metadata
   (Claim Search v1alpha1)    (Strict JSON) (Threat Lookup v4)     (EXIF, magic)
```

### Vercel Serverless Deployment

- **Entrypoint (`/api/index.js`)**: Exports the Express application directly as a Vercel Serverless Function. In local development, `backend/src/server.js` listens on port 8080.
- **Rewrites (`vercel.json`)**: Directs all `/api/*` traffic to `/api/index.js` while serving frontend assets statically.
- **Why uploads are capped at 4 MB**: Vercel Serverless Functions enforce a strict request body payload limit of ~4.5 MB. To prevent ungraceful HTTP 413 drops, both the client (`UploadPanel`) and the server (`multer`) enforce a clean 4 MB limit with plain-English user instructions.
- **Zero-Storage Privacy**: All file uploads are buffered in RAM memory storage (`multer.memoryStorage()`) and discarded after inspection. No user media is written to disk or stored in any database.

---

## 🧠 Machine Learning Notes

The `/ml` directory provides an experimental text classification microservice based on RoBERTa fine-tuned on the political claim dataset [LIAR](https://huggingface.co/datasets/liar).

### Dataset & Training
- The LIAR dataset contains 6 integer labels:
  - `0`: False
  - `1`: Half-True
  - `2`: Mostly-True
  - `3`: True
  - `4`: Barely-True
  - `5`: Pants-on-Fire
- In `ml/train_text.py`, these integer labels are mapped into 3 consolidated classes:
  - **False** (`0`): classes `0`, `4`, `5`
  - **Uncertain** (`1`): class `1`
  - **True** (`2`): classes `2`, `3`
- The training script logs class distributions and prints a warning if any class exceeds 70% of the dataset.

> ⚠️ **Important Accuracy Warning:**  
> Machine learning models trained on the LIAR dataset have historically low general-world accuracy (~60–65%) and cannot independently verify real-world facts. They learn linguistic style markers, not objective truth. Lie Detector Over Media treats ML outputs strictly as secondary heuristics and never presents them as definitive proof.

---

## 🎯 Accuracy, Match Thresholds & Verified References

Lie Detector Over Media enforces rigorous accuracy standards to prevent false positives and eliminate fabricated claims.

### 1. Matching Algorithm & Thresholds
Local fact-check matching (`backend/src/services/claimMatcher.js`) follows strict mathematical criteria:
- **Text Normalization**: Strips punctuation (including em/en dashes, quotes, and Hindi danda `।`), collapses multi-spaces, and converts to lowercase across English and Hindi.
- **Specific Multi-Word Phrases**: Registry entries strictly use multi-word compound phrases (e.g. `"5g towers spread"`, `"apollo moon landing was faked"`, `"star symbol 500 note fake"`) rather than generic isolated words (`covid`, `virus`, `water`, `sun`, `fake`).
- **Match Scoring**:
  $$\text{Match Ratio} = \frac{\text{matched distinct phrases}}{\text{total entry phrases}}$$
  A match requires:
  - $\text{Match Ratio} \ge 0.60$ (at least 60% of phrases present) **AND**
  - At least 3 distinct phrase matches (or 2 distinct matches if the registry entry has $\le 3$ phrases).
- **Debunking Statement Rejection**: The matcher rejects matches if the input text contains debunking terms (`debunked`, `disproves`, `disproved`, `myth`, `false claim`, `fact check`, `busted`, `hoax`, `untrue`, `झूठा`, `गलत दावा`, `अफवाह`) or claim negations (`never happened`, `did not happen`, `was not faked`). News stories debunking a rumor are never falsely flagged as rumors.
- **Semantic Similarity & NLI**: When the Python machine learning microservice is active, text embeddings compute cosine similarity ($\ge 0.78$) and Natural Language Inference (NLI) drops unrelated matches.
- **Honest Presentation Rule**: A local registry match is ALWAYS presented as *"Similar claim previously fact-checked"*, NEVER *"this claim"*. Only a live Google Fact Check API match on the exact statement may produce a strong verdict.

### 2. Confidence Evaluation Rules
Confidence (`backend/src/services/confidence.js`) is calculated systematically:
- **High Confidence**: Live Fact-Check API match on the same claim OR semantic similarity + NLI agreement on verified records.
- **Medium Confidence**: Registry phrase match $\ge 0.80$ OR clear writing style signals corroborated by an external model or documented citation.
- **Low Confidence**: Linguistic writing style signals only, without external fact-check evidence.

### 3. Automated Reference Verification (`scripts/verifyReferences.js`)
Every entry in `backend/src/data/factChecks.json` is verified against live endpoints:
```bash
npm run verify:references
```
- Performs live HTTP requests following redirects up to 5 hops.
- Confirms HTTP 200 OK status and verifies that page title/body content matches claim themes.
- Marks dead or failing links as `unverified` and fails CI with exit code 1.
- Only entries with `verificationStatus: "verified"` are used in runtime matching.

### 4. How to Add a Verified Reference
1. Verify the investigation was published by an established fact-checker (e.g., IFCN signatory, WHO, NASA, RBI, PIB).
2. Choose 3–5 specific multi-word phrases that uniquely characterize the rumor (avoid single generic words).
3. Add the entry to `backend/src/data/factChecks.json`:
   ```json
   {
     "id": "fc-unique-slug",
     "claim": "Summary of the claim.",
     "phrases": ["specific phrase one", "specific phrase two", "specific phrase three"],
     "publisher": "Investigating Organization",
     "rating": "False",
     "ratingMeaning": "Plain English explanation of why the claim is false.",
     "url": "https://official-verified-link.org/fact-check",
     "date": "YYYY-MM-DD",
     "language": "en",
     "verifiedOn": "YYYY-MM-DD",
     "verificationStatus": "verified"
   }
   ```
4. Run `node scripts/verifyReferences.js` and `npm test` to confirm clean verification.

---

## 📋 Software Requirements Specification (SRS) PDF

A comprehensive Software Requirements Specification document is generated and maintained in the root directory:
- **PDF Document**: [`Lie_Detector_Over_Media_Requirements.pdf`](Lie_Detector_Over_Media_Requirements.pdf)
- **Regenerate PDF**:
  ```bash
  npm run generate:requirements-pdf
  ```
The SRS includes complete functional requirements across all 5 media modalities, false-positive elimination rules, data contracts, security guidelines, and verified test acceptance matrices.

---

## 🛡️ Limitations & Privacy

- **Signals, Not Final Proof**: Lie Detector Over Media provides signals and educational indicators, not final truth verdicts. Always verify important breaking news and medical or financial claims across multiple authoritative primary sources.
- **Zero Content Storage**: We do not store your text, links, or uploaded media. Files are processed in volatile server memory and discarded immediately upon response completion.
- **Imperfect Detection**: AI models, domain heuristics, and metadata analysis can produce both false positives and false negatives. A missing EXIF header does not prove an image is AI-generated, and clean punctuation does not guarantee factual truth.

---

## 📄 Copyright & License

**Author:** Sarvesh Pandey  
**Copyright:** © 2026 Sarvesh Pandey. All rights reserved.  
Distributed under the **MIT License**. Contributions, bug reports, and pull requests are welcome!

---

## 📜 Changelog

### v2.1.0 (Lie Detector Over Media Rebranding & Ownership)
- **Product Rebranding**: Rebranded to **Lie Detector Over Media** ("See what's real.") across UI, backend, tests, documentation, and package manifests.
- **Copyright Attribution**: Assigned all copyright and author attribution to **Sarvesh Pandey** across project metadata, license, UI footer, and documentation.

### v2.0.0 (Core Engine & Accuracy Overhaul)
- **Product Architecture**: Full-stack modular verification across text, image, video, audio, and URL inputs.
- **Accurate Claim Matching**: Implemented strict multi-phrase matching algorithm with debunking-statement rejection and 0% false-positive rate on harmless statements.
- **Verified References**: Added live automated verification (`verify:references`) validating fact-check references with status 200 checks.
- **Removal of Fabricated Metrics**:
  - Deleted hash-seeded fake ELA error metrics and simulated image/audio manipulation percentages.
  - Replaced circular credibility calculation (`truthScore * 0.9 + 5`) with real signal aggregation (returns `null` when no real signal exists).
  - Removed misleading trust networks, gamification points, and leaderboards.
- **Strict Honesty & Transparency**:
  - Introduced `score: null` and plain-English "We cannot tell from this file alone" for images/videos/audio when external AI models are not configured.
  - Implemented honest `checks` transparency log listing every check that ran and what did not run.
  - Integrated real **Google Fact Check Tools API** with in-memory 10-minute caching.
- **New Response Schema**:
  - Modern, self-documenting schema (`type`, `input`, `verdict`, `reasons`, `sources`, `checks`, `nextSteps`, `technical`, `disclaimer`).
  - Single standardized verdict vocabulary: `likely_true` | `likely_false` | `uncertain`.
- **UI & UX Redesign**:
  - Warm light paper color palette (cream `#FFFDF7`, warm sand `#F4EFEA`, paper `#FFFFFF`, brown `#8B5E3C`, yellow `#F6C453`).
  - Structured 3-step interface: *1. What you want to check* -> *2. What you gave us* -> *3. What we found*.
  - Removed heavy charting dependencies (`recharts`, `zustand`), cutting JavaScript bundle size from 618 kB to 249 kB.
  - Added full Hindi (`hi`) and English (`en`) localization.
  - Added high-contrast accessible styling and dedicated print stylesheet for clean PDF export.
- **Security & Quality**:
  - Hardened with `helmet`, configurable IP rate limiting (`express-rate-limit`), and explicit CORS restrictions.
  - 4 MB file upload limit with friendly HTTP 413 handling and 25-second server timeout protection.
  - Added comprehensive test suites: Node test runner for backend and Vitest + Testing Library for frontend (31 passing tests).
  - Enforced TypeScript strict mode (`no-explicit-any`) and automated GitHub Actions CI.
