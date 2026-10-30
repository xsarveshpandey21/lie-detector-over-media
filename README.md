# 🔍 Satya Lens

<div align="center">

![Satya Lens Dashboard](https://github.com/user-attachments/assets/338fbfbf-4be6-4ed9-9db2-b2cd1a06942a)



**See what's real. An AI-assisted misinformation and content reliability platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.x-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178c6)](https://www.typescriptlang.org)

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [API](#-api-reference) • [Architecture](#-architecture) • [Deployment](#-deployment)

</div>

---

## 🎯 Overview

Satya Lens is a comprehensive platform designed to combat misinformation by analyzing and evaluating content across multiple media types.

### 🌟 Key Highlights

- **Multi-format Detection**: Text, images, videos, audio files, and URLs
- **Real-time Analysis**: Instant feedback on content authenticity
- **Educational Tools**: Learn to spot fake content yourself
- **Community Driven**: Crowdsourced verification and trust scoring
- **Privacy First**: Optional edge-mode for local analysis
- **Gamification**: Earn badges and points for contributing

---

## 📊 Features

### Content Analysis Capabilities

| Media Type | Detection Methods | Confidence Score |
|------------|------------------|------------------|
| 📝 **Text** | NLP sentiment analysis, fact-checking APIs, linguistic patterns | ✓ High |
| 🖼️ **Image** | ELA forensics, metadata analysis, reverse image search | ✓ High |
| 🎥 **Video** | Frame-by-frame analysis, deepfake detection, audio-video sync | ✓ Medium |
| 🔊 **Audio** | Voice cloning detection, spectral analysis, codec artifacts | ✓ Medium |
| 🔗 **URL** | Domain reputation, content scraping, historical verification | ✓ High |

### Detection Metrics

```
Truth Score Breakdown
├── Forensic Analysis (40%)
│   ├── Technical artifacts
│   ├── Metadata inconsistencies
│   └── Manipulation markers
├── Cross-verification (30%)
│   ├── Fact-checking databases
│   ├── Reverse searches
│   └── Source credibility
├── AI Detection (20%)
│   ├── Generative patterns
│   ├── Synthetic markers
│   └── Model signatures
└── Community Input (10%)
    ├── User reports
    ├── Expert reviews
    └── Historical data
```

---

## 🏗️ Architecture

### Monorepo Structure

```
satya-lens/
├── 🔧 backend/              # Express.js API server
│   ├── src/
│   │   ├── routes/
│   │   │   └── analyze.js   # Main analysis endpoint
│   │   ├── services/
│   │   │   ├── detectors/   # Media-specific detectors
│   │   │   │   ├── text.js
│   │   │   │   ├── image.js
│   │   │   │   ├── video.js
│   │   │   │   ├── audio.js
│   │   │   │   └── url.js
│   │   │   ├── crossVerify.js
│   │   │   ├── education.js
│   │   │   └── credibility.js
│   │   ├── db/
│   │   │   └── mock.js      # Mock database
│   │   └── server.js
│   ├── package.json
│   ├── .env.sample
│   └── README.md
│
├── 🎨 frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── components/
│   │       ├── UploadPanel.tsx
│   │       ├── TruthMeter.tsx
│   │       ├── ReportCard.tsx
│   │       ├── MentorTips.tsx
│   │       ├── Badges.tsx
│   │       ├── Leaderboard.tsx
│   │       ├── TrustGraph.tsx
│   │       ├── Chatbot.tsx
│   │       └── ThemeToggle.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── postcss.config.js
│   └── tailwind.config.js
│
└── vercel.json              # Deployment configuration
```

### Technology Stack

**Frontend**
- ⚛️ React 18 with TypeScript
- ⚡ Vite for blazing-fast builds
- 🎨 Tailwind CSS for styling
- 📊 Recharts for data visualization
- 🎯 Lucide React for icons

**Backend**
- 🟢 Node.js with Express.js
- 📦 Multer for file uploads
- 🔒 CORS enabled
- 🌐 RESTful API design

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/satya-lens/satya-lens.git
cd satya-lens
```

#### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.sample .env
# Edit .env with your API keys

# Start development server
npm run dev
```

**Environment Variables:**

```env
PORT=5000
NODE_ENV=development

# API Keys (optional, for enhanced detection)
OPENAI_API_KEY=your_openai_key
GOOGLE_FACT_CHECK_API_KEY=your_google_key
CLARIFAI_API_KEY=your_clarifai_key
```

#### 3️⃣ Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📡 API Reference

### Analyze Content

**Endpoint:** `POST /api/analyze`

**Content-Type:** `multipart/form-data` or `application/json`

#### Request Examples

**Text Analysis:**
```json
{
  "type": "text",
  "text": "Breaking: Major event happened today!",
  "language": "en"
}
```

**URL Analysis:**
```json
{
  "type": "url",
  "url": "https://example.com/article"
}
```

**File Upload (Image/Video/Audio):**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "type=image" \
  -F "file=@suspicious-image.jpg"
```

#### Response Structure

```json
{
  "type": "image",
  "truthScore": 68,
  "label": "likely_fake",
  "confidence": "medium",
  "explanations": [
    "Detected ELA artifacts around face region",
    "EXIF timestamp mismatch with claimed date",
    "No matching results in reverse image search"
  ],
  "summary": "This image likely has been manipulated. Multiple forensic markers suggest digital alteration, particularly in facial regions.",
  "breakdown": {
    "forensics": {
      "ela_score": 0.72,
      "splicing_detected": 0.61,
      "clone_detection": 0.45
    },
    "metadata": {
      "exif_present": true,
      "timestamp_mismatch": true,
      "camera_model": "Unknown",
      "gps_coordinates": null
    },
    "crossVerification": [
      {
        "source": "Reuters Fact Check",
        "match": false,
        "credibility": 0.95
      },
      {
        "source": "Snopes",
        "match": false,
        "credibility": 0.88
      }
    ]
  },
  "education": {
    "tip": "Look for inconsistent lighting and shadows across different parts of the image.",
    "fakeVsReal": [
      "/examples/manipulated-comparison.jpg",
      "/examples/original-reference.jpg"
    ],
    "learnMore": "/guides/image-forensics"
  },
  "gamification": {
    "badge": "Truth Explorer",
    "points": 5,
    "newLevel": false,
    "totalPoints": 125
  },
  "community": {
    "votes": {
      "true": 12,
      "false": 34,
      "unsure": 8
    },
    "expertReviews": 2,
    "trustGraph": []
  }
}
```

### Truth Score Labels

| Score Range | Label | Description |
|------------|-------|-------------|
| 0-20 | `highly_fake` | Strong evidence of manipulation |
| 21-40 | `likely_fake` | Multiple fake indicators |
| 41-60 | `uncertain` | Mixed or insufficient evidence |
| 61-80 | `likely_true` | Appears authentic |
| 81-100 | `highly_true` | Strong verification |

---

## 🎮 Gamification System

### Badges & Achievements

| Badge | Requirement | Points |
|-------|------------|--------|
| 🔍 Truth Seeker | Analyze first content | 5 |
| 🎯 Fact Finder | 10 successful verifications | 25 |
| 🏆 Truth Champion | 100 analyses | 100 |
| 👥 Community Hero | 50+ helpful votes | 50 |
| 🧠 Expert Analyst | 90%+ accuracy rate | 200 |

### Leaderboard

```
┌────────────────────────────────────┐
│  Top Truth Seekers (This Month)   │
├────┬──────────┬────────┬───────────┤
│ #  │   User   │ Points │  Accuracy │
├────┼──────────┼────────┼───────────┤
│ 🥇 │  alice   │  1,250 │    94%    │
│ 🥈 │  bob     │    980 │    91%    │
│ 🥉 │  charlie │    875 │    89%    │
└────┴──────────┴────────┴───────────┘
```

---

## 🎓 Educational Resources

Satya Lens includes educational components:

- **AI Mentor Tips**: Context-specific advice for each analysis
- **Side-by-side Comparisons**: Real vs. fake examples
- **Detection Guides**: Learn forensic techniques
- **Interactive Tutorials**: Hands-on practice
- **Latest Trends**: Updates on emerging fake content tactics

---

## 🔒 Privacy & Security

### Edge Mode (Coming Soon)

For sensitive content, enable edge-mode to:
- ✅ Process data locally in your browser
- ✅ No data sent to servers
- ✅ Instant offline analysis
- ⚠️ Limited to basic heuristics

### Data Handling

- Uploaded files are analyzed in-memory
- No permanent storage of user content
- Optional anonymous statistics collection
- GDPR compliant

---

## 🚀 Deployment

### Frontend (Vercel - Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

The `vercel.json` configuration handles routing and backend proxy.

### Backend Options

**Option 1: Render**
```bash
# Connect your GitHub repo to Render
# Set environment variables in dashboard
# Deploy automatically on push
```

**Option 2: Heroku**
```bash
cd backend
heroku create satya-lens-api
git push heroku main
```

**Option 3: Fly.io**
```bash
cd backend
flyctl launch
flyctl deploy
```

### Environment Configuration

Update frontend API endpoint after backend deployment:

```typescript
// frontend/src/api/client.ts
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend.com';
```

---

## 🛠️ Development Roadmap

- [ ] Integration with OpenAI GPT-4 for text analysis
- [ ] Advanced deepfake detection models
- [ ] Real-time collaborative fact-checking
- [ ] Browser extension
- [ ] Mobile applications (iOS/Android)
- [ ] API rate limiting and authentication
- [ ] Advanced analytics dashboard
- [ ] Multi-language support expansion
- [ ] Edge-mode full implementation

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Keep commits atomic and well-described

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Fact-checking APIs: Google Fact Check Tools, ClaimBuster
- AI Detection: OpenAI, Anthropic Claude
- Forensic Tools: ELA, JPEG compression analysis
- Community: Open-source contributors

---

