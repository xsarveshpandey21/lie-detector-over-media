# 🔍 Satya Lens

<div align="center">

**"See what's real."**

A simple web tool to help you check whether text, photos, video, audio, or website links are reliable.

[![CI](https://img.shields.io/badge/CI-Passing-brightgreen?logo=githubactions&logoColor=white)](#-quick-start)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5E3C.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-F6C453?logo=node.js&logoColor=black)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-222222?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Features](#-what-works-right-now) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Architecture](#-architecture--deployment) • [ML Notes](#-machine-learning-notes) • [Limitations & Privacy](#-limitations--privacy) • [Changelog](#-changelog)

</div>

---

## 📌 What Works Right Now

Satya Lens adheres to a strict honesty rule: **never fabricate results or claim certainty**. If an external AI model or API key is not configured, we provide honest `"not checked"` and `"not available"` transparency states with `score: null` rather than fake scores.

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
git clone <repository-url> satya-lens
cd satya-lens

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

> **Note:** **None of these keys are required to run the app.** Satya Lens works out of the box with honest "not available" states.

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
> Machine learning models trained on the LIAR dataset have historically low general-world accuracy (~60–65%) and cannot independently verify real-world facts. They learn linguistic style markers, not objective truth. Satya Lens treats ML outputs strictly as secondary heuristics and never presents them as definitive proof.

---

## 🛡️ Limitations & Privacy

- **Signals, Not Final Proof**: Satya Lens provides signals and educational indicators, not final truth verdicts. Always verify important breaking news and medical or financial claims across multiple authoritative primary sources.
- **Zero Content Storage**: We do not store your text, links, or uploaded media. Files are processed in volatile server memory and discarded immediately upon response completion.
- **Imperfect Detection**: AI models, domain heuristics, and metadata analysis can produce both false positives and false negatives. A missing EXIF header does not prove an image is AI-generated, and clean punctuation does not guarantee factual truth.

---

## 📄 License & Contributing

Distributed under the **MIT License**. Contributions, bug reports, and pull requests are welcome!

---

## 📜 Changelog

### v2.0.0 (Satya Lens Major Overhaul)
- **Product Rebranding**: Completely rebranded from *TruthLens AI* to **Satya Lens** ("See what's real.") across UI, backend, documentation, package slugs, and logos.
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
